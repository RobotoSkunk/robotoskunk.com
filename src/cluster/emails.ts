import 'source-map-support/register';
import winston from 'winston';

import path from 'path';

import env from "../env";
import { pgConn } from "../libraries/conn";
import { genTemplate } from '../libraries/logger';
import { RSCrypto } from 'dotcomcore/dist/RSEngine';
import { Mailer } from '../libraries/mailer';


async function sleep()
{
	return new Promise(resolve => setTimeout(resolve, 15000));
}

export const logger = winston.createLogger(
	genTemplate(
		path.join(process.cwd(), 'logs/mailer'),
		'error.log'
	)
);



interface Email {
	id: string;
	hash: string;
	_to: string;
	subject: string;
	body: string;
	attempts: number;
}


(async () =>
{
	const mailer = new Mailer(
		{
			host: env.emails.noreply.host,
			port: env.emails.noreply.port,
			secure: env.emails.noreply.secure,
			auth: {
				user: env.emails.noreply.auth.user,
				pass: env.emails.noreply.auth.pass
			}
		},
		logger,
		Mailer.Mode.Production,
		env.root,
		pgConn,
		env.keys.MASTER
	);


	try {
		if (await mailer.transporter.verify()) {
			logger.info('Email server is online.');
		} else {
			logger.error('Email server does not work.');
			process.exit(1);
		}
	} catch (e) {
		logger.error(e);
		process.exit(2);
	}

	while (true) {
		const conn = await pgConn.connect();

		try {
			const {
				rows
			} = await conn.query('SELECT * FROM mail_queue WHERE attempts < 3 ORDER BY created_at ASC LIMIT 1');

			if (rows.length === 0) {
				await sleep();
				continue;
			}
	
			const row: Email = rows[0];
	
			try {
				const key = await mailer.GenerateCryptoKey(row.hash);
				const to = await RSCrypto.Decrypt(row._to, key);
				const body = await RSCrypto.Decrypt(row.body, key);
	
				await mailer.Send(to, row.subject, body);
				await conn.query('DELETE FROM mail_queue WHERE id = $1', [ row.id ]);
			} catch (e) {
				logger.error(e);
				await conn.query('UPDATE mail_queue SET attempts = attempts + 1 WHERE id = $1', [ row.id ]);
			}
		} catch (e) {
			logger.error(e);
		} finally {
			conn.release();
		}

		await sleep();
	}
})();
