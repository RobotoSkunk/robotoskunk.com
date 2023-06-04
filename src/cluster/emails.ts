/*
	robotoskunk.com - The whole main website of RobotoSkunk.
	Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


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



interface LegacyEmail {
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
			logger.info('LegacyEmail server is online.');
		} else {
			logger.error('LegacyEmail server does not work.');
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
	
			const row: LegacyEmail = rows[0];
	
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
