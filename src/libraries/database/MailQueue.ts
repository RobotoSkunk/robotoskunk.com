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


import ejs from 'ejs';
import { mailer } from '../db-esentials';

import DotComCore from 'dotcomcore';
import nodemailer from 'nodemailer';
import { logger } from '../logger';

import crypto from 'crypto';
import { RSCrypto } from 'dotcomcore/dist/RSEngine';


/**
 * Controls the flow of the sent emails.
 */
export class MailQueue
{
	private static contactEmail: string;
	private static websiteDomain: string;
	private static transporter: nodemailer.Transporter;

	public static async GenerateCryptoKey(hash: string): Promise<string> {
		return await RSCrypto.PBKDF2(process.env.MASTER_KEY, hash, 1000, 32);
	}

	/**
	 * Sends a new email to the queue.
	 * @param email The email address to send the email to.
	 * @param subject The subject of the email.
	 * @param body The body of the email.
	 */
	public static async SendEmail(email: string, subject: string, body: string)
	{
		// If the website is in development mode, don't send the email.
		// Instead use a test account from ethereal.email.
		if (process.env.NODE_ENV === 'development') {
			try {
				// If the account hasn't been created yet, create it.
				if (!MailQueue.transporter) {
					const testAccount = await nodemailer.createTestAccount();
	
					MailQueue.transporter = nodemailer.createTransport({
						host: testAccount.smtp.host,
						port: testAccount.smtp.port,
						secure: testAccount.smtp.secure,
						auth: {
							user: testAccount.user,
							pass: testAccount.pass
						}
					});
				}

				// Send the email.
				// Don't use await here because it will slow down the response time.
				MailQueue.transporter.sendMail({
					from: `"RobotoSkunk" <${process.env.EMAIL_AUTH_USER}>`,
					to: email,
					subject: subject,
					html: body

				}).then((info) => {
					console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

				}).catch((e) => {
					console.error(e);
				});
			} catch (e) {
				console.error(e);
			}

			return;
		}


		const client = await DotComCore.Core.Connect();

		try {
			const id = crypto.randomBytes(16).toString('base64url');
			const hash = crypto.randomBytes(32).toString('hex');

			const cryptoKey = await MailQueue.GenerateCryptoKey(hash);
			const encryptedEmail = await RSCrypto.Encrypt(email, cryptoKey);
			const encryptedBody = await RSCrypto.Encrypt(body, cryptoKey);


			await client.query(`INSERT INTO
				mail_queue (id, hash, _to, subject, body)
				VALUES ($1, $2, $3, $4, $5)`,
				[
					id,
					hash,
					encryptedEmail,
					subject,
					encryptedBody
				]
			);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}



	public static async GenerateTemplate(
		template: 'createAccount',
		recipient: string,
		data: {
			link: string
		}
	): Promise<string>;
	public static async GenerateTemplate(template: string, recipient: string, data: any): Promise<string>
	{
		const options = Object.assign({}, data, {
			websiteDomain: MailQueue.websiteDomain,
			recipient: recipient,
			contactEmail: MailQueue.contactEmail
		});


		const _body = await ejs.renderFile(`layouts/utils/mailer/${template}.ejs`, options);

		return await ejs.renderFile(`layouts/utils/mailer/template.ejs`, {
			body: _body,
			recipient: recipient,
			websiteDomain: MailQueue.websiteDomain,
			contactEmail: MailQueue.contactEmail
		});
	}
}
