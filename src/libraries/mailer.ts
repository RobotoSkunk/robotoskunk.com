import path from 'path';
import crypto from 'crypto';

import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import winston from 'winston';
import ejs from 'ejs';
import { Pool } from 'pg';
import { RSCrypto } from 'dotcomcore/dist/RSEngine';


export class Mailer {
	public transporter: nodemailer.Transporter;

	private mode: Mailer.Mode;
	private logger: winston.Logger;
	private options: SMTPTransport.Options;
	private root: string;
	private pg: Pool;
	private key: string;

	constructor(options: SMTPTransport.Options, logger: winston.Logger, mode: Mailer.Mode, root: string, pg: Pool, key: string) {
		this.mode = mode;
		this.logger = logger;
		this.options = options;
		this.root = root;
		this.pg = pg;
		this.key = key;

		if (mode === Mailer.Mode.Debug) {
			(async () => {
				try {
					const test = await nodemailer.createTestAccount();

					this.transporter = nodemailer.createTransport({
						host: test.smtp.host,
						port: test.smtp.port,
						secure: test.smtp.secure,
						auth: {
							user: test.user,
							pass: test.pass
						}
					});
				} catch (e) {
					logger.error(e);
				}
			})();
		} else if (mode === Mailer.Mode.Production)
			this.transporter = nodemailer.createTransport(options);
	}

	public async GenerateCryptoKey(hash: string): Promise<string> {
		return await RSCrypto.PBKDF2(this.key, hash, 1000, 32);
	}

	public async Send(to: string, subject: string, body: string) {
		if (this.mode !== Mailer.Mode.Internal) {
			return this.transporter.sendMail({
				from: this.options.auth.user,
				to: to,
				subject: subject,
				html: await this.MailBody(body, to)
			}, (err, info) => {
				if (err) return this.logger.error(err);

				if (this.mode === Mailer.Mode.Debug)
					this.logger.info(`Email sent: ${nodemailer.getTestMessageUrl(info)}`);
			});
		}


		const conn = await this.pg.connect();

		try {
			const id = crypto.randomBytes(16).toString('base64url');
			const hash = crypto.randomBytes(32).toString('hex');

			const key = await this.GenerateCryptoKey(hash);
			const email = await RSCrypto.Encrypt(to, key);
			const _body = await RSCrypto.Encrypt(body, key);

			await conn.query('INSERT INTO mail_queue (id, hash, _to, subject, body) VALUES ($1, $2, $3, $4, $5)', [ id, hash, email, subject, _body ]);
		} catch (e) {
			this.logger.error(e);
		} finally {
			conn.release();
		}
	}

	private async MailBody(body: string, recipient: string): Promise<string> {
		return (await ejs.renderFile(path.join(process.cwd(), 'layouts/utils/mail.ejs'), {
			body,
			root: this.root,
			recipient
		})).replace(/[\t\n]/g, '');
	}
}

export namespace Mailer {
	export enum Mode {
		Debug,
		Internal,
		Production
	}
}
