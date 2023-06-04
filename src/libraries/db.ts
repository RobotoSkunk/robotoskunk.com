import stringify from 'safe-stable-stringify';

import { logger } from '../globals';
import { RSCrypto, RSUtils } from 'dotcomcore/dist/RSEngine';
import { __commentLimiter } from './rateLimiter';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { Commission } from '../data/comms';

import { pgConn, rtConn } from './conn';
import { LegacyUser, LegacyEmail, Token, UserToken, mailer } from './db-esentials';
export { pgConn, rtConn, LegacyUser, LegacyEmail, Token, UserToken, mailer };



export class Shout {
	public id: number;
	public author: string;
	public victim: string;
	public content: string;
	public createdAt: Date;
	public editedAt: Date;

	constructor(id: number, author: string, victim: string, content: string, createdAt: Date, editedAt: Date) {
		this.id = id;
		this.author = author;
		this.victim = victim;
		this.content = content;
		this.createdAt = createdAt;
		this.editedAt = editedAt;
	}

	public static LengthIsValid(cont: string): boolean {
		cont = cont.trim();
		return cont.length > 0 && cont.length <= 250;
	}
	public static async Parse(content: string): Promise<string> {
		content = content.trim();
		content = await LegacyUser.HandlerToInstance(content);
		return content;
	}
	public static async Unparse(content: string): Promise<string> {
		content = await LegacyUser.InstanceToHandler(content);
		return content;
	}


	public async *GetEdits(): AsyncGenerator<Shout.Edit> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT cont, created_at FROM shout_edit_history WHERE shout = $1 ORDER BY created_at DESC`, [ this.id ]);

			for (const row of _res.rows) {
				yield {
					content: row.cont,
					createdAt: row.created_at
				};
			}
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	public async GetAuthor(): Promise<LegacyUser|null> { return await LegacyUser.GetById(this.author); }

	public static async Create(author: string, victim: string, content: string, onRateLimiting: (res: RateLimiterRes) => any): Promise<Exclude<Shout.Code, 'NOT_ALLOWED' | 'MAXIMUM_EDITS'>> {
		if (!Shout.LengthIsValid(content)) return Shout.Code.INVALID_LENGTH;

		try {
			await __commentLimiter.consume(`user:${author}:shout:${victim}`);
		} catch (e) {
			if (!(e instanceof Error)) onRateLimiting(e);

			return Shout.Code.RATE_LIMITED;
		}

		const client = await pgConn.connect();
		content = await Shout.Parse(content);

		try {
			const _res = await client.query(`INSERT INTO shouts (author, victim, cont) VALUES ($1, $2, $3) RETURNING id`, [ author, victim, content ]);
			if (_res.rows.length === 0) return Shout.Code.INTERNAL_ERROR;

			return Shout.Code.SUCCESS;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return Shout.Code.INTERNAL_ERROR;
	}

	public static async GetById(id: number): Promise<Shout | null> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT * FROM shouts WHERE id = $1`, [ id ]);
			if (_res.rows.length === 0) return null;

			const shout = _res.rows[0];
			return new Shout(shout.id, shout.author, shout.victim, await Shout.Unparse(shout.cont), shout.created_at, shout.edited_at);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}
	public static async *GetByVictim(victim: string, page: number): AsyncGenerator<Shout> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT * FROM shouts WHERE victim = $1 ORDER BY created_at DESC LIMIT 10 OFFSET $2`, [ victim, page * 10 ]);

			for (const row of _res.rows)
				yield new Shout(row.id, row.author, row.victim, await Shout.Unparse(row.cont), row.created_at, row.edited_at);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
	public static async GetByVictimCount(author: string): Promise<number> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT COUNT(1) FROM shouts WHERE victim = $1`, [ author ]);
			return _res.rows[0].count;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}


	public async Update(author: string, content: string): Promise<Exclude<Shout.Code, 'RATE_LIMITED'>> {
		if (!Shout.LengthIsValid(content)) return Shout.Code.INVALID_LENGTH;
		if (this.author !== author) return Shout.Code.NOT_ALLOWED;

		const client = await pgConn.connect();
		content = await Shout.Parse(content);

		try {
			const _res = await client.query(`SELECT COUNT(1) FROM shout_edit_history WHERE shout = $1`, [ this.id ]);
			if (_res.rows[0].count >= 5) return Shout.Code.MAXIMUM_EDITS;

			await client.query(`UPDATE shouts SET cont = $1, edited_at = CURRENT_TIMESTAMP WHERE id = $2`, [ content, this.id ]);
			await client.query(`INSERT INTO shout_edit_history (shout, cont) VALUES ($1, $2)`, [ this.id, this.content ]);

			this.content = content;
			this.editedAt = new Date();

			return Shout.Code.SUCCESS;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return Shout.Code.INTERNAL_ERROR;
	}

	public async Delete(): Promise<Exclude<Shout.Code, 'INVALID_LENGTH' | 'MAXIMUM_EDITS' | 'RATE_LIMITED' | 'NOT_ALLOWED'>> {
		const client = await pgConn.connect();

		try {
			await client.query(`DELETE FROM shouts WHERE id = $1`, [ this.id ]);
			return Shout.Code.SUCCESS;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return Shout.Code.INTERNAL_ERROR;
	}
}
export namespace Shout {
	export interface Edit {
		content: string;
		createdAt: Date;
	}

	export enum Code {
		SUCCESS,
		INTERNAL_ERROR,
		NOT_ALLOWED,
		INVALID_LENGTH,
		MAXIMUM_EDITS,
		RATE_LIMITED
	}
}


export class PasswordToken extends Token {
	public uid: string;

	constructor(id: string, validator: string, createdAt: Date, expiresAt: Date, uid: string) {
		super(id, validator, createdAt, expiresAt);
		this.uid = uid;
	}

	public static async Get(token: string): Promise<PasswordToken> {
		if (!Token.TokenFormat(token)) return null;
		const [ id, _ ] = token.split('.');

		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT * FROM password_resets WHERE id = $1`, [ id ]);
			if (_res.rows.length === 0) return null;

			const token = _res.rows[0];
			return new PasswordToken(token.id, token.val_key, token.created_at, token.expires_at, token.usrid);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return null;
	}

	public async Authorize(token: string): Promise<boolean> {
		if (!Token.TokenFormat(token)) return false;
		const [ _, validator ] = token.split('.');

		const tok = await PasswordToken.Get(token);
		if (!tok) return false;

		return await tok.Validate(validator);
	}

	public async Delete() {
		const client = await pgConn.connect();

		try {
			await client.query(`DELETE FROM password_resets WHERE id = $1`, [ this.id ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}

	public ToString() { return `${this.id}.${this.validator}` }
}



export class UserAuditLog {
	public uid: string;
	public data: any;
	public userAgent: string;
	public type: UserAuditLog.Type;
	public relevance: UserAuditLog.Relevance;
	public createdAt: Date;
	public destroysAt: Date;

	constructor(uid: string, userAgent: string, type: UserAuditLog.Type, relevance: UserAuditLog.Relevance, createdAt: Date, destroysAt: Date, data: any) {
		this.uid = uid;
		this.userAgent = userAgent;
		this.type = type;
		this.relevance = relevance;
		this.data = data;
		this.createdAt = createdAt;
		this.destroysAt = destroysAt;
	}

	public static async *FetchPage(uid: string, page: number, filters = UserAuditLog.Relevance.ANY): AsyncGenerator<UserAuditLog> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT * FROM user_audit_log WHERE _uid = $1 AND _relevance & $2 != 0 ORDER BY created_at DESC LIMIT 10 OFFSET $3`, [ uid, filters, page * 10 ]);

			for (const row of _res.rows)
				yield new UserAuditLog(row._uid, row.user_agent, row._type, row._relevance, row.created_at, row.destroys_at, row._data);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return [];
	}

	public static async GetPageCount(uid: string, filters = UserAuditLog.Relevance.ANY): Promise<number> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT COUNT(1) FROM user_audit_log WHERE uid = $1AND _relevance & $2 != 0 `, [ uid, filters ]);
			return _res.rows[0].count;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}

	public static async *Fetch(uid: string, filters = UserAuditLog.Relevance.ANY): AsyncGenerator<UserAuditLog> {
		const client = await pgConn.connect();

		try {
			const _res = await client.query(`SELECT * FROM user_audit_log WHERE _uid = $1 AND _relevance & $2 != 0 ORDER BY created_at DESC`, [ uid, filters ]);

			for (const row of _res.rows)
				yield new UserAuditLog(row._uid, row.user_agent, row._type, row._relevance, row.created_at, row.destroys_at, row._data);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return [];
	}

	public static async Add(uid: string, userAgent: string, type: UserAuditLog.Type, relevance: UserAuditLog.Relevance, extras?: any): Promise<void> {
		const client = await pgConn.connect();

		try {
			var _data = null;
			if (extras) _data = stringify(extras);

			userAgent = RSUtils.AnonymizeAgent(userAgent);

			await client.query(`INSERT INTO user_audit_log (_uid, _type, _relevance, user_agent, _data) VALUES ($1, $2, $3, $4, $5)`, [ uid, type, relevance, userAgent, _data ]);
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}
	}
}
export namespace UserAuditLog {
	export enum Relevance {
		LOW    = 1 << 0,
		MEDIUM = 1 << 1,
		HIGH   = 1 << 2,
		ANY    = LOW | MEDIUM | HIGH
	}

	export enum Type {
		FAILED_LOGIN,
		LOGIN,
		LOGOUT,
		PASSWORD_CHANGE_REQUEST,
		FORGOT_PASSWORD,
		PASSWORD_CHANGE,
		EMAIL_ADD,
		EMAIL_REMOVE,
		MAIN_EMAIL_CHANGE,
		AUDIT_LOG_REQUESTED,
		ADDED_TWOFACTOR,
		REMOVED_TWOFACTOR,
		DELETE_ACCOUNT_REQUESTED,
		DELETE_ACCOUNT_REJECTED,
		PROFILE_UPDATE,
		FAILED_SECURITY_ACCESS,
		FAILED_PASSWORD_CHANGE
	}
}



export class Config {
	public static async Get(key: string): Promise<number> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT _value FROM config WHERE _key = $1', [ key ]);

			return res.rowCount === 0 ? 0 : res.rows[0]._value;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}
}


export class Commissions {
	public static async GetStatus(id: string): Promise<Commissions.Status> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT deadline, curl, cancel_reason, paypal_id FROM commissions WHERE id = $1', [ id ]);
			if (res.rowCount === 0) return Commissions.Status.EXPIRED;
			const commission: Commission = res.rows[0];

			if (commission.paypal_id) return Commissions.Status.PAID;
			if (commission.cancel_reason) return Commissions.Status.DECLINED;
			if (commission.curl) return Commissions.Status.FINISHED;

			if (commission.deadline) {
				if (commission.deadline.getTime() < Date.now()) return Commissions.Status.EXPIRED;
				return Commissions.Status.ACCEPTED;
			}

			return Commissions.Status.WAITING;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return Commissions.Status.EXPIRED;
	}

	public static StatusBanner(status: Commissions.Status, extras?: string): string {
		var badgeClass = 'badge', name = '';

		switch (status) {
			case Commissions.Status.WAITING: name = 'Waiting'; break;
			case Commissions.Status.ACCEPTED: badgeClass += ' generic'; name = 'In process'; break;
			case Commissions.Status.DECLINED: badgeClass += ' alert'; name = 'Declined'; break;
			case Commissions.Status.FINISHED: badgeClass += ' success'; name = 'Finished'; break;
			case Commissions.Status.PAID: badgeClass += ' success'; name = 'Paid'; break;
			case Commissions.Status.EXPIRED: badgeClass += ' warning'; name = 'Deadline expired'; break;
		}

		if (extras) badgeClass += ` ${extras}`;

		return `<span class="${badgeClass}"><span class="dot"></span>${name}</span>`;
	}

	public static async GetOpen(): Promise<Commission[]> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT id, _title, author FROM commissions WHERE curl IS NULL AND cancel_reason IS NULL AND (deadline IS NULL OR deadline > NOW()) ORDER BY created_at ASC');
			return res.rows;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return [];
	}

	public static async GetOpenCount(): Promise<number> {
		const client = await pgConn.connect();

		try {
			const res = await client.query('SELECT COUNT(1) FROM commissions WHERE curl IS NULL AND cancel_reason IS NULL AND (deadline IS NULL OR deadline > NOW())');
			return res.rows[0].count;
		} catch (e) {
			logger.error(e);
		} finally {
			client.release();
		}

		return 0;
	}
}
export namespace Commissions {
	export enum Status {
		WAITING,
		ACCEPTED,
		DECLINED,
		FINISHED,
		PAID,
		EXPIRED
	}
}
