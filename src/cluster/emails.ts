import 'source-map-support/register';
import winston from 'winston';

import path from 'path';

import conf from "../conf";
import { pgConn } from "../libs/conn";
import { genTemplate } from '../libs/logger';
import { RSCrypto } from '../libs/RSEngine';
import { Mailer } from '../libs/mailer';


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
			host: conf.emails.noreply.host,
			port: conf.emails.noreply.port,
			secure: conf.emails.noreply.secure,
			auth: {
				user: conf.emails.noreply.auth.user,
				pass: conf.emails.noreply.auth.pass
			}
		},
		logger,
		Mailer.Mode.Production,
		conf.root,
		pgConn,
		conf.keys.MASTER
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
