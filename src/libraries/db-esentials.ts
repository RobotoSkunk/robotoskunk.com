import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import util from 'util';

import { MxRecord } from 'dns';
import { CookieOptions } from 'express';
import bcrypt from 'bcrypt';
import dns from 'dns/promises';
import argon2 from 'argon2';

import { env, logger, regex } from '../globals';
import { RSCrypto, RSUtils, RSRandom, RSTime } from 'dotcomcore/dist/RSEngine';
import { Blacklist, UserRoles } from './db-utils';
import { __commentLimiter } from './rateLimiter';
import { OTPAuth } from './otpauth';
import { Mailer } from './mailer';

import { pgConn, rtConn } from './conn';
export { pgConn, rtConn };

export const mailer = new Mailer({
	host: env.emails.noreply.host,
	port: env.emails.noreply.port,
	secure: env.emails.noreply.secure,
	auth: {
		user: env.emails.noreply.auth.user,
		pass: env.emails.noreply.auth.pass
	}
}, logger, env.production ? Mailer.Mode.Internal : Mailer.Mode.Debug, env.root, pgConn, env.keys.MASTER);


export class LegacyEmail {
	public id: string;
	public hash: string;
	public email: string;
	public userId: string;
	public type: LegacyEmail.Type;
	public verified: boolean;
	public createdAt: Date;
	public isFake: boolean;


	constructor(id: string, hash: string, email: string, userId: string, type: LegacyEmail.Type, verified: boolean, createdAt: Date, isFake: boolean) {
		this.id = id;
		this.hash = hash;
		this.email = email;
		this.userId = userId;
		this.type = type;
		this.verified = verified;
		this.createdAt = createdAt;
		this.isFake = isFake;
	}


	static async GetById(id: string): Promise<LegacyEmail | null> {
		const client = await pgConn.connect();

		try {
			const res = await client.query(`SELECT * FROM emails WHERE id = $1`, [ id ]);
			if (res.rowCount === 0) return null;
			const row = res.rows[0];

			return new LegacyEmail(row.id, row.hash, row.email, row.usrid, row.refer, row.verified, row.created_at, row.is_fake);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	static async Get(email: string): Promise<LegacyEmail | null> {
		const client = await pgConn.connect();

		try {
			const res = await client.query(`SELECT id FROM emails WHERE hash = $1`, [ LegacyEmail.HMAC(email.toLowerCase()) ]);
			if (res.rowCount === 0) return null;
			const row = res.rows[0];

			return await LegacyEmail.GetById(row.id);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	/**
	 * Gets an user object attached to an email
	 * @returns The user object
	 */
	async GetUser(): Promise<LegacyUser|null> {
		return new Promise(async (resolve, reject) => {
			const u = await LegacyUser.GetById(this.userId);

			if (u) return resolve(u);
			reject(new Error('LegacyUser not found'));
		});
	}

	/**
	 * Checks if an email is valid.
	 * @param email The email to check.
	 * @returns True if the email is valid, false otherwise.
	 */
	public static async Validate(email: string): Promise<boolean> {
		// Check syntax of email
		email = email.toLowerCase();
		if (email.length > 200) return false;  
		if (!regex.email.test(email)) return false;

		const [ user, domain ] = email.split('@');

		// Check if user and domain are valid
		if (LegacyEmail.invalidNames.includes(user)) return false;
		if (LegacyEmail.validDomains.includes(domain)) return true;

		try {
			const readFile = util.promisify(fs.readFile);
			const data = (await readFile(path.join(process.cwd(), 'disposable_email_blocklist.env'), 'ascii')).replace('\r\n', '\n');

			for (const line of data.split('\n'))
				if (line === domain) return true;
		} catch (_) { }


		const records = await LegacyEmail.LookupMX(domain);
		if (records.length === 0) return false;

		return true;
	}

	public static async LookupMX(domain: string): Promise<MxRecord[]> {
		try {
			return await dns.resolveMx(domain);
		} catch (_) { }

		return [];
	}


	public static HMAC(email: string): string { return RSCrypto.HMAC(email + env.keys.SALT, env.keys.HMAC); }

	public static async Exists(email: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query(`SELECT id FROM emails WHERE hash = $1`, [ LegacyEmail.HMAC(email.toLowerCase()) ]);

			return res.rowCount > 0;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async SetType(type: LegacyEmail.Type): Promise<void> {
		const client = await pgConn.connect();

		try {
			await client.query(`UPDATE emails SET refer = $1 WHERE id = $2`, [ type, this.id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	public static async Set(email: string, key: string, uid: string, type: LegacyEmail.Type = LegacyEmail.Type.PRIMARY): Promise<LegacyEmail | null> {
		const hash = LegacyEmail.HMAC(email.toLowerCase());
		const enc = await RSCrypto.Encrypt(email.toLowerCase(), key);

		const client = await pgConn.connect();

		try {
			if (!await LegacyUser.Exists(uid)) return null;
			if (await LegacyEmail.Exists(email)) return null;

			const res = await client.query('INSERT INTO emails (hash, email, usrid, refer) VALUES ($1, $2, $3, $4) RETURNING id', [ hash, enc, uid, type ]);
			if (res.rowCount === 0) return null;

			return LegacyEmail.GetById(res.rows[0].id);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}
	public static async SetFake(email: string, key: string, uid: string, type: LegacyEmail.Type = LegacyEmail.Type.PRIMARY): Promise<boolean> {
		const hash = LegacyEmail.HMAC(RSCrypto.RandomBytes(32));
		const enc = await RSCrypto.Encrypt(email.toLowerCase(), key);

		const client = await pgConn.connect();

		try {
			if (!await LegacyUser.Exists(uid)) return false;

			await client.query('INSERT INTO emails (hash, email, usrid, refer, is_fake) VALUES ($1, $2, $3, $4, true)', [ hash, enc, uid, type ]);
			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	async Read(key: string): Promise<string> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT email FROM emails WHERE hash = $1', [ this.hash ]);
			if (res.rowCount === 0) return null;

			return await RSCrypto.Decrypt(res.rows[0].email, key);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}

	public async Send(type: LegacyEmail.MailType, ...args: string[]) {
		if (this.isFake) return await RSRandom.Wait(50, 150);
		const conn = await pgConn.connect();

		function verifyLink(token: string) { return `${env.root}/verify-email/${token}`; }
		const contactLink = `${env.root}/contact`;


		try {
			var body: string, subject: string;

			switch (type) {
				case LegacyEmail.MailType.NEW_USER: {
					const id = RSCrypto.RandomBytes(16);
					const validator = RSCrypto.RandomBytes(32);
					const valHash = RSCrypto.HMAC(validator, env.keys.HMAC);

					await conn.query('INSERT INTO verify_email_queue (id, val_key, eid) VALUES ($1, $2, $3)', [ id, valHash, this.id ]);


					subject = 'Welcome to robotoskunk.com!';
					body = `<h2>Verify your RobotoSkunk account.</h2>
						<p>Someone tried to create a RobotoSkunk account using this email. If it was you, confirm your email using the following link:
						<p><a href="${verifyLink(`${id}.${validator}`)}">${verifyLink(`${id}.${validator}`)}</a>

						<p>If it wasn't you, you can safely ignore this email. If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
					break;
				}
				case LegacyEmail.MailType.VERIFY: {
					if (this.verified) return;

					var token: string;

					const res = await conn.query('SELECT id FROM verify_email_queue WHERE eid = $1', [ this.id ]);
					if (res.rowCount === 0) {
						const id = RSCrypto.RandomBytes(16);
						const validator = RSCrypto.RandomBytes(32);
						const valHash = RSCrypto.HMAC(validator, env.keys.HMAC);

						await conn.query('INSERT INTO verify_email_queue (id, val_key, eid) VALUES ($1, $2, $3)', [ id, valHash, this.id ]);

						token = `${id}.${validator}`;
					} else {
						const validator = RSCrypto.RandomBytes(32);
						const valHash = RSCrypto.HMAC(validator, env.keys.HMAC);

						await conn.query('UPDATE verify_email_queue SET val_key = $1 WHERE eid = $2', [ valHash, this.id ]);
						token = `${res.rows[0].id}.${validator}`;
					}


					subject = 'Verify your email address';
					body = `<h2>Verify your email address.</h2>
						<p>Someone sent you an email verification request. If it was you, confirm your email using the following link:
						<p><a href="${verifyLink(token)}">${verifyLink(token)}</a>

						<p>If it wasn't you, you can safely ignore this email. If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
					break;
				}
				case LegacyEmail.MailType.PASSWORD_RESET_REQUEST: {
					if (!this.verified || this.type !== LegacyEmail.Type.PRIMARY) return;

					var token: string;

					const res = await conn.query(`SELECT id FROM password_resets WHERE usrid = $1`, [ this.userId ]);
					if (res.rowCount === 0) {
						const id = RSCrypto.RandomBytes(16);
						const validator = RSCrypto.RandomBytes(32);
						const valHash = RSCrypto.HMAC(validator, env.keys.HMAC);

						await conn.query('INSERT INTO password_resets (id, val_key, usrid) VALUES ($1, $2, $3)', [ id, valHash, this.userId ]);

						token = `${id}.${validator}`;
					} else {
						const validator = RSCrypto.RandomBytes(32);
						const valHash = RSCrypto.HMAC(validator, env.keys.HMAC);

						await conn.query('UPDATE password_resets SET val_key = $1 WHERE usrid = $2', [ valHash, this.userId ]);
						token = `${res.rows[0].id}.${validator}`;
					}

					subject = 'Reset your password';
					body = `<h2>Reset your password.</h2>
						<p>Someone has requested a password reset for your account. If it was you, reset your password using the following link:

						<p><a href="${env.root}/accounts/change-password?token=${token}">${env.root}/accounts/change-password?token=${token}</a>

						<p>If it wasn't you, someone else may be trying to access your account. You should change your password immediately.
						<p>If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
					break;
				}
				case LegacyEmail.MailType.PASSWORD_RESET: {
					subject = 'Your password has been reset';
					body = `<h2>Your password has been reset.</h2>
						<p>Your password has been reset. If you did request this, you can now log in with your new password.
						
						<p>If you did not request this, please contact us at <a href="${contactLink}">${contactLink}</a> immediately.`;
					break;
				}
				case LegacyEmail.MailType.ACCOUNT_DELETION: {
					subject = 'Someone has requested to delete your account';
					body = `<h2>Someone has requested to delete your account.</h2>
						<p>Someone has requested to delete your account. If it was you, you shouldn't need to do anything. Your account will be deleted in 7 days.

						<p>If it wasn't you, you can cancel the deletion request by logging in and going to your account settings.

						<p>If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
					break;
				}
			}

			const user = await this.GetUser();
			const realEmail = await this.Read(await user.GetCryptoKey());

			await mailer.Send(realEmail, subject, body);			
		} catch (e) {
			logger.error(e);
		} finally {
			conn.release();
		}
	}

	public async Delete(): Promise<boolean> {
		const conn = await pgConn.connect();

		try {
			if (this.type === LegacyEmail.Type.PRIMARY) return false;

			await conn.query('DELETE FROM emails WHERE hash = $1', [ this.hash ]);
			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			conn.release();
		}

		return false;
	}

	public static async Verify(token: string): Promise<boolean> {
		const conn = await pgConn.connect();

		try {
			if (!Token.TokenFormat(token)) return false;

			const [ id, validator ] = token.split('.');
			const valHash = RSCrypto.HMAC(validator, env.keys.HMAC);

			const res = await conn.query('SELECT eid, val_key FROM verify_email_queue WHERE id = $1', [ id ]);
			if (res.rowCount === 0) return false;

			if (!RSCrypto.Compare(valHash, res.rows[0].val_key)) return false;

			await conn.query('DELETE FROM verify_email_queue WHERE id = $1', [ id ]);
			await conn.query('UPDATE emails SET verified = true WHERE id = $1', [ res.rows[0].eid ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			conn.release();
		}

		return false;
	}
}
export namespace LegacyEmail {
	export enum Type {
		PRIMARY = 0,
		CONTACT = 1,
		SECONDARY = 2
	}
	export enum MailType {
		NEW_USER,
		VERIFY,
		PASSWORD_RESET_REQUEST,
		PASSWORD_RESET,
		ACCOUNT_DELETION
	}

	export const validDomains = [
		'live.com.mx', 'gmail.com', 'yahoo.com', 'hotmail.com', 'aol.com', 'hotmail.co.uk', 'hotmail.fr',
		'msn.com', 'yahoo.fr', 'wanadoo.fr', 'orange.fr', 'comcast.net', 'yahoo.co.uk',
		'yahoo.com.br', 'yahoo.co.in', 'live.com', 'rediffmail.com', 'free.fr', 'gmx.de',
		'web.de', 'yandex.ru', 'ymail.com', 'libero.it', 'outlook.com', 'uol.com.br',
		'bol.com.br', 'mail.ru', 'cox.net', 'hotmail.it', 'sbcglobal.net', 'sfr.fr',
		'live.fr', 'verizon.net', 'live.co.uk', 'googlemail.com', 'yahoo.es', 'ig.com.br',
		'live.nl', 'bigpond.com', 'terra.com.br', 'yahoo.it', 'neuf.fr', 'yahoo.de',
		'alice.it', 'rocketmail.com', 'att.net', 'laposte.net', 'facebook.com', 'bellsouth.net',
		'yahoo.in', 'hotmail.es', 'charter.net', 'yahoo.ca', 'yahoo.com.au', 'rambler.ru',
		'hotmail.de', 'tiscali.i', 'shaw.c', 'yahoo.co.j', 'sky.co', 'earthlink.net', 'optonline.net',
		'freenet.de', 't-online.de', 'aliceadsl.fr', 'virgilio.it', 'home.nl', 'qq.com', 'telenet.be',
		'me.com', 'yahoo.com.ar', 'tiscali.co.uk', 'yahoo.com.mx', 'voila.fr', 'gmx.net', 'mail.com',
		'planet.nl', 'tin.it', 'live.it', 'ntlworld.com', 'arcor.de', 'yahoo.co.id', 'frontiernet.net',
		'hetnet.nl', 'live.com.au', 'yahoo.com.sg', 'zonnet.nl', 'club-internet.fr', 'juno.com',
		'optusnet.com.au', 'blueyonder.co.uk', 'bluewin.ch', 'skynet.be', 'sympatico.ca',
		'windstream.net', 'mac.com', 'centurytel.net', 'chello.nl', 'live.ca', 'aim.com', 'bigpond.net.au',
		'robotoskunk.com', 'microsoft.com', 'google.com', 'goddady.com'
	];
	export const invalidNames = [
		'noreply', 'no-reply', 'support', 'example', 'info', 'user', 'mail', 'test', 'noreply-dominos',
		'microsoftstore', 'news', 'email', 'notification', 'purchases', 'purchase', 'notifications',
		'noreply-purchases', 'message', 'messages', 'no-responder', 'dominospizzamx', 'friendupdates',
		'mailer', 'reply'
	];
}



export class Token {
	public id: string;
	public validator: string;
	public createdAt: Date;
	public expiresAt: Date;

	constructor(id: string, validator: string, createdAt: Date, expiresAt: Date) {
		this.id = id;
		this.validator = validator;
		this.createdAt = createdAt;
		this.expiresAt = expiresAt;
	}
	public static TokenFormat(token: string): boolean { return token.split('.').filter(Boolean).length === 2; }
	public static HMAC(secret: string): string { return RSCrypto.HMAC(secret, env.keys.HMAC); }


	public async Validate(validator: string): Promise<boolean> { return RSCrypto.Compare(this.validator, Token.HMAC(validator)); }
}
export namespace Token {
	export interface Response {
		id: string;
		validator: string;
		validatorHash: string;
		updated: boolean;
	}
}

export class UserToken extends Token {
	public usrid: string;
	public client: string;
	public is_tmp: boolean;
	public verified: boolean;
	public lastUsage: Date;
	public lastUpdate: Date;


	constructor(id: string, validator: string, createdAt: Date, expiresAt: Date, client: string, usrid: string, lastUsage: Date, lastUpdate: Date, is_tmp: boolean, verified: boolean) {
		super(id, validator, createdAt, expiresAt);
		this.client = client;
		this.usrid = usrid;
		this.lastUsage = lastUsage;
		this.lastUpdate = lastUpdate;
		this.is_tmp = is_tmp;
		this.verified = verified;
	}

	public async GetUser(): Promise<LegacyUser> { return await LegacyUser.GetById(this.usrid); }

	public static async Set(uid: string, remember: boolean, useragent: string, verified: boolean): Promise<UserToken.Response | null> {
		const client = await pgConn.connect();


		try {
			const id = RSCrypto.RandomBytes(16);
			const validator = RSCrypto.RandomBytes(32);
			const browser = RSUtils.AnonymizeAgent(useragent);


			const _res = await client.query(`INSERT INTO auth_tokens (id, usrid, client, val_key, is_temp, expires_at, verified) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + INTERVAL '1 ${remember ? 'WEEK' : 'HOUR'}', $6) RETURNING created_at, expires_at, last_usage, last_update`, [
				id,
				uid,
				browser,
				RSCrypto.HMAC(validator, env.keys.HMAC),
				!remember,
				verified
			]);


			return {
				token: new UserToken(id, RSCrypto.HMAC(validator, env.keys.HMAC), _res.rows[0].created_at, _res.rows[0].expires_at, browser, uid, _res.rows[0].last_usage, _res.rows[0].lastUpdate, !remember, verified),
				text: `${id}.${validator}`
			}
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}

	public static async Get(id: string): Promise<UserToken|null> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT * FROM auth_tokens WHERE id = $1;`, [ id ]);
			if (_res.rows.length === 0) return null;

			const token = _res.rows[0];
			return new UserToken(token.id, token.val_key, token.created_at, token.expires_at, token.client, token.usrid, token.last_usage, token.last_update, token.is_temp, token.verified);

		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}

	public static async Auth(token: string, userAgent: string): Promise<UserToken.Response | null> {
		if (!Token.TokenFormat(token)) return null;
		const [ id, validator ] = token.split('.');

		const tok = await UserToken.Get(id);
		if (!tok) return null;


		if(await tok.Validate(validator)) {
			if (!tok.verified) return null;
			const client = await pgConn.connect();

			try {
				const _tmp = await client.query(`UPDATE auth_tokens SET last_usage = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '1 ${tok.is_tmp ? 'HOUR' : 'WEEK'}' WHERE id = $1 RETURNING last_usage, expires_at`, [ id ]);
				tok.lastUsage = _tmp.rows[0].last_usage;
				tok.expiresAt = _tmp.rows[0].expires_at;
				var updated = false;
				var __validator = validator;


				if (tok.lastUpdate.getTime() < Date.now() - RSTime._HOUR_) {
					const newValidator = RSCrypto.RandomBytes(32);

					await client.query(`UPDATE auth_tokens SET val_key = $1, last_update = CURRENT_TIMESTAMP, client = $2 WHERE id = $3`, [
						Token.HMAC(newValidator),
						RSUtils.AnonymizeAgent(userAgent),
						id
					]);

					tok.validator = Token.HMAC(newValidator);
					__validator = newValidator;
					updated = true;
				}

				return {
					token: tok,
					text: `${tok.id}.${__validator}`,
					updated: updated
				};
			} catch (e) {
				logger.error(e);
			} finally {
				client.release();
			}
		}

		return null;
	}

	public static async SimpleAuth(token: string): Promise<UserToken | null> {
		if (!Token.TokenFormat(token)) return null;
		const [ id, validator ] = token.split('.');

		const tok = await UserToken.Get(id);
		if (!tok) return null;

		return await tok.Validate(validator) ? tok : null;
	}

	public async TwoFactorAuth(): Promise<void> {
		const client = await pgConn.connect();

		try {
			await client.query(`UPDATE auth_tokens SET verified = true WHERE id = $1`, [ this.id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	public GetCookieParams(isOnion: boolean): CookieOptions {
		return {
			expires: this.is_tmp ? undefined : new Date(Date.now() + RSTime._YEAR_ * 10),
			path: '/',
			secure: env.production && !isOnion,
			httpOnly: true,
			sameSite: 'lax',
			domain: isOnion ? undefined : (env.production ? `.${env.domain}` : 'localhost')
		};
	}

	public async Destroy(): Promise<void> {
		const client = await pgConn.connect();

		try {
			await client.query(`DELETE FROM auth_tokens WHERE id = $1`, [ this.id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}


	public async GenerateCSRF(): Promise<string> {
		const client = await pgConn.connect();
		const csrf = RSCrypto.RandomBytes(32);

		try {
			await client.query(`UPDATE auth_tokens SET _csrf = $1 WHERE id = $2`, [ RSCrypto.HMAC(csrf, env.keys.HMAC), this.id ]);

			return csrf;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return csrf;
	}
	public async ValidateCSRF(csrf: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT _csrf FROM auth_tokens WHERE id = $1`, [ this.id ]);

			return RSCrypto.Compare(_res.rows[0]._csrf, RSCrypto.HMAC(csrf, env.keys.HMAC));
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async GenerateConfigAuth(): Promise<string> {
		const client = await pgConn.connect();
		const auth = RSCrypto.RandomBytes(32);

		try {
			await client.query(`UPDATE auth_tokens SET _config_auth = $1 WHERE id = $2`, [ RSCrypto.HMAC(auth, env.keys.HMAC), this.id ]);

			return auth;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return auth;
	}
	public async ValidateConfigAuth(auth: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT _config_auth FROM auth_tokens WHERE id = $1`, [ this.id ]);

			return RSCrypto.Compare(_res.rows[0]._config_auth, RSCrypto.HMAC(auth, env.keys.HMAC));
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}


	public async *GetAllByUser(): AsyncGenerator<UserToken> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT id FROM auth_tokens WHERE usrid = $1 ORDER BY created_at DESC`, [ this.usrid ]);

			for (const row of _res.rows) {
				const tok = await UserToken.Get(row.id);

				if (tok !== null) yield tok;
			}
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
}
export namespace UserToken {
	export interface Response {
		token: UserToken;
		text: string;
		updated?: boolean;
	}
}



export class LegacyUser {
	public id: string;
	public hash: string;
	public name: string;
	public handler: string;
	public birthdate: Date;
	public roles: UserRoles;

	public createdAt?: Date;
	public bio?: string;	
	public endDate?: Date;


	constructor(id: string, hash: string, name: string, handler: string, birthdate: Date, roles: UserRoles) {
		this.id = id;
		this.hash = hash;
		this.name = name;
		this.handler = handler;
		this.birthdate = birthdate;
		this.roles = roles;
	}

	public get url(): string { return `/user/${this.handler}`; }
	public get avatar(): string { return `/avatar/default.webp`; }


	// #region Security management
	private static async GenerateCryptoKey(hash: string): Promise<string> {
		return await RSCrypto.PBKDF2(env.keys.MASTER, hash, 1000, 32);
	}
	public async GetCryptoKey(): Promise<string> {
		return await LegacyUser.GenerateCryptoKey(this.hash);
	}
	// #endregion

	// #region LegacyUser management
	static async Auth(email: string, password: string): Promise<LegacyUser.Response> {
		const response: LegacyUser.Response = { code: LegacyUser.Code.INTERNAL_ERROR }
		const client = await pgConn.connect();

		await RSRandom.Wait(0, 150);

		try {
			const emailObj = await LegacyEmail.Get(email);
			if (!emailObj) { response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD; return response; }
			if (emailObj.type != LegacyEmail.Type.PRIMARY) { response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD; return response; }

			const res = await client.query('SELECT id, password, totp_secret, totp_enabled FROM users WHERE id = $1', [ emailObj.userId ]);
			const passHash = res.rows[0].password as string;

			if (passHash.startsWith('$2')) {
				if (!(await bcrypt.compare(password, passHash))) { response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD; return response; }

				const newPass = await argon2.hash(password);
				await client.query('UPDATE users SET password = $1 WHERE id = $2', [ newPass, emailObj.userId ]);

			} else {
				if (!(await argon2.verify(passHash, password))) { response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD; return response; }

				if (argon2.needsRehash(passHash)) {
					const newPass = await argon2.hash(password);
					await client.query('UPDATE users SET password = $1 WHERE id = $2', [ newPass, emailObj.userId ]);
				}
			}


			response.code = LegacyUser.Code.SUCCESS;
			response.user = await LegacyUser.GetById(res.rows[0].id);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return response;
	}
	public static async Set(username: string, email: string, password: string, birthdate: Date): Promise<LegacyUser.Code> {
		const response = LegacyUser.Code.INTERNAL_ERROR;
		const client = await pgConn.connect();

		try {
			if (!RSTime.MinimumAge(birthdate)) return LegacyUser.Code.MINOR;
			if (await LegacyUser.ExistsByHandler(username)) return LegacyUser.Code.ALREADY_EXISTS;


			const hash = crypto.randomBytes(32).toString('hex');
			const pwrd = await argon2.hash(password);

			const res = await client.query('INSERT INTO users (hash, username, _handler, password, birthdate) VALUES ($1, $2, $3, $4, $5) RETURNING id', [ hash, username, username, pwrd, birthdate ]);

			const _email = await LegacyEmail.Set(email, await LegacyUser.GenerateCryptoKey(hash), res.rows[0].id as string);
			if (!_email) return LegacyUser.Code.INTERNAL_ERROR;

			_email.Send(LegacyEmail.MailType.NEW_USER);

			return LegacyUser.Code.SUCCESS;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return response;
	}


	static async GetById(uid: string): Promise<LegacyUser|null> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id, hash, username, _handler, birthdate, roles FROM users WHERE id = $1', [ uid ]);
			if (res.rowCount === 0) return null;
			const user = res.rows[0];


			return new LegacyUser(user.id, user.hash, user.username, user._handler, user.birthdate, new UserRoles(user.roles));
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}
	static async GetByHandler(handler: string): Promise<LegacyUser|null> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id FROM users WHERE LOWER(_handler) = LOWER($1)', [ handler ]);
			if (res.rowCount === 0) return null;

			return await LegacyUser.GetById(res.rows[0].id);
		} catch(e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}


	public static async Exists(id: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id FROM users WHERE id = $1', [id]);

			return res.rowCount > 0;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public static async ExistsByHandler(handler: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id FROM users WHERE LOWER(_handler) = LOWER($1)', [ handler ]);

			return res.rowCount > 0;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async GetDeleteDate(): Promise<Date|null> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT end_date FROM users WHERE id = $1', [ this.id ]);

			return res.rows[0].end_date;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}

	public async Delete(password: string, aprove: boolean): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			if (!await this.VerifyPassword(password)) return false;

			if (aprove)
				await client.query(`UPDATE users SET end_date = CURRENT_TIMESTAMP + INTERVAL '1 WEEK' WHERE id = $1`, [ this.id ]);
			else
				await client.query(`UPDATE users SET end_date = NULL WHERE id = $1`, [ this.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	public async VerifyPassword(password: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT password FROM users WHERE id = $1', [ this.id ]);
			return await argon2.verify(res.rows[0].password, password);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async ChangePassword(password: string) {
		const client = await pgConn.connect();

		try {
			const pwrd = await argon2.hash(password);

			await client.query('UPDATE users SET password = $1 WHERE id = $2', [ pwrd, this.id ]);
			await client.query('DELETE FROM auth_tokens WHERE usrid = $1', [ this.id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	async *GetEmails(): AsyncGenerator<LegacyEmail> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id FROM emails WHERE usrid = $1 ORDER BY refer ASC', [ this.id ]);

			for (const row of res.rows) yield await LegacyEmail.GetById(row.id);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return [];
	}
	async GetEmailsCount(): Promise<number> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT COUNT(1) FROM emails WHERE usrid = $1', [ this.id ]);

			return res.rows[0].count;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}


	async SetPrimaryEmail(id: string) {
		const client = await pgConn.connect();

		try {
			await client.query('UPDATE emails SET refer = $1 WHERE usrid = $2 AND refer = $3', [ LegacyEmail.Type.SECONDARY, this.id, LegacyEmail.Type.PRIMARY ]);
			await client.query('UPDATE emails SET refer = $1 WHERE id = $2', [ LegacyEmail.Type.PRIMARY, id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	async SetContactEmail(id: string) {
		const client = await pgConn.connect();

		try {
			await client.query('UPDATE emails SET refer = $1 WHERE usrid = $2 AND refer = $3', [ LegacyEmail.Type.SECONDARY, this.id, LegacyEmail.Type.CONTACT ]);
			await client.query('UPDATE emails SET refer = $1 WHERE id = $2', [ LegacyEmail.Type.CONTACT, id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	async UnsetContactEmail() {
		const client = await pgConn.connect();

		try {
			await client.query('UPDATE emails SET refer = $1 WHERE usrid = $2 AND refer = $3', [ LegacyEmail.Type.SECONDARY, this.id, LegacyEmail.Type.CONTACT ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	async GetPrimaryEmail(): Promise<LegacyEmail> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id FROM emails WHERE usrid = $1 AND refer = $2', [ this.id, LegacyEmail.Type.PRIMARY ]);
			return await LegacyEmail.GetById(res.rows[0].id);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}

	async GetContactEmail(): Promise<LegacyEmail|null> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id FROM emails WHERE usrid = $1 AND refer = $2', [ this.id, LegacyEmail.Type.CONTACT ]);
			if (res.rowCount > 0) return await LegacyEmail.GetById(res.rows[0].id);

			return null;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}


	async CheckBlacklist(): Promise<Blacklist.FLAGS> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT _type FROM blacklist WHERE usrid = $1', [ this.id ]);

			var flags = 0;
			for (const row of res.rows) flags |= row._type;

			return flags;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return Blacklist.FLAGS.NONE;
	}
	async CheckSpecificBlacklist(type: Blacklist.FLAGS): Promise<Blacklist.Entry> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT * FROM blacklist WHERE usrid = $1 AND _type = $2', [ this.id, type ]);
			if (res.rowCount > 0) return res.rows[0];

			return null;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}
	// #endregion


	// #region Security
	public async Enabled2FA(): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT totp_enabled FROM users WHERE id = $1', [ this.id ]);
			return res.rows[0].totp_enabled;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async Verify2FA(code: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT totp_secret FROM users WHERE id = $1', [ this.id ]);
			const secret = await RSCrypto.Decrypt(res.rows[0].totp_secret, await this.GetCryptoKey());

			const totp = new OTPAuth(secret);
			return await totp.check(code);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async Set2FA(): Promise<void> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT totp_secret FROM users WHERE id = $1', [ this.id ]);
			if (res.rows[0].totp_secret) return;

			const secret = await RSCrypto.Encrypt(await OTPAuth.genSecret(), await this.GetCryptoKey());
			await client.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [ secret, this.id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	public async Enable2FA(): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			await client.query('UPDATE users SET totp_enabled = true WHERE id = $1', [ this.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async Disable2FA(): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			await client.query('UPDATE users SET totp_enabled = false, totp_secret = null WHERE id = $1', [ this.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async GetTOTPSecret(): Promise<OTPAuth> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT totp_secret FROM users WHERE id = $1', [ this.id ]);
			const secret = await RSCrypto.Decrypt(res.rows[0].totp_secret, await this.GetCryptoKey());

			return new OTPAuth(secret, '@' + this.handler);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}


	public async GenerateRecoveryCodes(): Promise<string[]> {
		const client = await pgConn.connect();

		try {
			const codes = [], hashes = [];
			for (var i = 0; i < 3; i++) {
				const code = RSCrypto.RandomBytes(8)

				codes.push(code);
				hashes.push(RSCrypto.HMAC(code, env.keys.HMAC));
			}

			await client.query('UPDATE users SET totp_recovery = $1 WHERE id = $2', [ `{${hashes.join(',')}}`, this.id ]);

			return codes;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}
	public async VerifyRecoveryCode(code: string): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT totp_recovery FROM users WHERE id = $1', [ this.id ]);
			const codes = res.rows[0].totp_recovery as string[];
			const c = RSCrypto.HMAC(code, env.keys.HMAC);
			var found = false;

			for (var i = 0; i < codes.length; i++) {
				if (RSCrypto.Compare(codes[i], c)) {
					found = true;
					codes.splice(i, 1);
				}
			}

			if (found) await client.query('UPDATE users SET totp_recovery = $1 WHERE id = $2', [ `{${codes.join(',')}}`, this.id ]);

			return found;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async DestroyRecoveryCodes(): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			await client.query('UPDATE users SET totp_recovery = null WHERE id = $1', [ this.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}
	public async GetRecoveryCodesCount(): Promise<number> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT totp_recovery FROM users WHERE id = $1', [ this.id ]);
			const codes = res.rows[0].totp_recovery as string[];

			return codes.length;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}
	// #endregion


	// #region LegacyUser interactions
	//  #region Following
	public async AddFollow(user: LegacyUser): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			if (this.id === user.id) return false;
			if (await this.IsFollowing(user)) return false;
			if (await this.HasBlocked(user)) return false;
			await client.query('INSERT INTO follow_list (author, victim) VALUES ($1, $2)', [ this.id, user.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async RemoveFollow(user: LegacyUser): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			if (this.id === user.id) return false;
			if (!await this.IsFollowing(user)) return false;
			await client.query('DELETE FROM follow_list WHERE author = $1 AND victim = $2', [ this.id, user.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async IsFollowing(user: LegacyUser): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT 1 FROM follow_list WHERE author = $1 AND victim = $2', [ this.id, user.id ]);

			return res.rowCount > 0;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async *GetFollowing(): AsyncGenerator<LegacyUser> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT author FROM follow_list WHERE victim = $1', [ this.id ]);

			for (const row of res.rows) yield await LegacyUser.GetById(row.author);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	public async GetFollowingCount(): Promise<number> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT COUNT(1) FROM follow_list WHERE victim = $1', [ this.id ]);

			return res.rows[0].count;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}
	//  #endregion

	//  #region Blocked
	public async HasBlocked(user: LegacyUser): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT 1 FROM block_list WHERE author = $1 AND victim = $2', [ this.id, user.id ]);

			return res.rowCount > 0;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async BlockUser(user: LegacyUser): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			if (this.id === user.id) return false;
			if (await this.HasBlocked(user)) return false;
			await client.query('INSERT INTO block_list (author, victim) VALUES ($1, $2)', [ this.id, user.id ]);
			await this.RemoveFollow(user);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async UnblockUser(user: LegacyUser): Promise<boolean> {
		const client = await pgConn.connect();

		try {
			if (this.id === user.id) return false;
			if (!await this.HasBlocked(user)) return false;
			await client.query('DELETE FROM block_list WHERE author = $1 AND victim = $2', [ this.id, user.id ]);

			return true;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return false;
	}

	public async *GetBlocked(): AsyncGenerator<LegacyUser> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT victim FROM block_list WHERE author = $1', [ this.id ]);

			for (const row of res.rows) yield await LegacyUser.GetById(row.victim);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	public async GetBlockedCount(): Promise<number> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT COUNT(1) FROM block_list WHERE author = $1', [ this.id ]);

			return res.rows[0].count;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}
	//  #endregion

	//  #region Mentions
	public static async HandlerToInstance(msg: string): Promise<string> {
		const mentions = msg.match(/@([a-zA-Z0-9_-]+)/gm);

		if (mentions) {
			for (const mention of mentions) {
				const user = await LegacyUser.GetByHandler(mention.slice(1));
				if (user) msg = msg.replace(mention, `<@${user.id}>`);
				else msg = msg.replace(mention, `\\@${mention.slice(1)}`);
			}
		}

		return msg;
	}

	public static async InstanceToHandler(msg: string): Promise<string> {
		// ID formats are in UUID
		const mentions = msg.match(/<@([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})>/gm);

		if (mentions) {
			for (const mention of mentions) {
				const user = await LegacyUser.GetById(mention.slice(2, -1));
				if (user) msg = msg.replace(mention, `@${user.handler}`);
				else msg = msg.replace(mention, '\\@deleted-user');
			}
		}

		return msg;
	}
	// #endregion
	// #endregion


	async LoadFullData(): Promise<void> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT created_at, bio, end_date FROM users WHERE id = $1', [ this.id ]);
			if (res.rowCount === 0) return;

			const user = res.rows[0];

			this.bio = user.bio;
			this.createdAt = user.created_at;
			this.endDate = user.end_date;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
}
export namespace LegacyUser {
	export enum Code {
		SUCCESS =                   0,
		INTERNAL_ERROR =            1 << 0,
		INVALID_EMAIL_OR_PASSWORD = 1 << 1,
		// REQUIRE_2FA =               1 << 2,
		// INVALID_2FA =               1 << 3,
		ALREADY_EXISTS =            1 << 4,
		MINOR =                     1 << 5
	}

	export interface Response {
		code: Code;
		user?: LegacyUser;
	}
}
