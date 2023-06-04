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


import { OAuthScopes } from "./db-utils";
import { LegacyUser, pgConn } from "./db";
import { env, logger } from "../globals";
import crypto from 'crypto';
import { RSCrypto } from "dotcomcore/dist/RSEngine";

export namespace API {
	export class App {
		id: string;
		name: string;
		description?: string;
		teamId: string;
		createdAt?: Date;
		verifiedAt?: Date;

		website?: string;
		url_TOS?: string;
		url_Privacy?: string;
		redirects: string[];
		minimumAge?: number;
		permissions: OAuthScopes;
		rateLimit: number;


		constructor(id: string, name: string, teamId: string, redirects: string[], permissions: OAuthScopes, rateLimit: number) {
			this.id = id;
			this.name = name;
			this.teamId = teamId;
			this.redirects = redirects;
			this.permissions = permissions;
			this.rateLimit = rateLimit;
		}

		public async LoadFullData() {
			const conn = await pgConn.connect();

			try {
				const res = await conn.query(`SELECT * FROM api_app WHERE id = $1`, [ this.id ]);
				if (res.rowCount === 0) throw new Error(`App with id ${this.id} does not exist.`);

				const row = res.rows[0];

				this.description = row._desc;
				this.createdAt = row.created_at;
				this.verifiedAt = row.verified_at;
				this.website = row.website;
				this.url_TOS = row.url_tos;
				this.url_Privacy = row.url_privacy;
				this.minimumAge = row.minimum_age;
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}

		public async Save() {
			const conn = await pgConn.connect();

			try {
				await conn.query(`UPDATE api_app SET _name = $1, _desc = $2, website = $3, url_tos = $4, url_privacy = $5, minimum_age = $6, url_redirects = $7, permissions = $8, rate_limit = $9 WHERE id = $10`, [
					this.name,
					this.description,
					this.website,
					this.url_TOS,
					this.url_Privacy,
					this.minimumAge,
					this.redirects,
					this.permissions,
					this.rateLimit,
					this.id
				]);
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}

		public async GetNewToken(): Promise<string> {
			const conn = await pgConn.connect();

			try {
				const token = RSCrypto.RandomBytes(64);
				const hash = RSCrypto.HMAC(token, env.keys.HMAC);

				await conn.query(`UPDATE api_app SET secret = $1 WHERE id = $2`, [ hash, this.id ]);

				return token;
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}


		public static async Set(name: string, teamId: string): Promise<string> {
			const conn = await pgConn.connect();

			try {
				const token = crypto.randomBytes(32).toString('hex');
				const res = await conn.query(`INSERT INTO api_app (_name, _tid, secret) VALUES ($1, $2, $3) RETURNING id`, [ name, teamId, token ]);

				return res.rows[0].id;
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}

		public static async GetById(id: string): Promise<App> | null {
			const conn = await pgConn.connect();

			try {
				const res = await conn.query(`SELECT id, _name, _tid, url_redirects, permissions, rate_limit FROM api_app WHERE id = $1`, [ id ]);
				if (res.rowCount === 0) return null;
				const row = res.rows[0];

				return new App(row.id, row._name, row._tid, row.url_redirects, row.permissions, row.rate_limit);
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}
		public static async *GetByTeamId(teamId: string): AsyncGenerator<App> {
			const conn = await pgConn.connect();

			try {
				const res = await conn.query(`SELECT id FROM api_app WHERE _tid = $1`, [ teamId ]);
				if (res.rowCount === 0) return;

				for (const row of res.rows) yield await App.GetById(row.id);
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}
	}

	export class Team {
		id: string;
		name: string;
		createdAt?: Date;

		constructor(id: string, name: string) {
			this.id = id;
			this.name = name;
		}

		public async LoadFullData() {
			const conn = await pgConn.connect();

			try {
				const res = await conn.query(`SELECT * FROM api_team WHERE id = $1`, [ this.id ]);
				if (res.rowCount === 0) throw new Error(`Team with id ${this.id} does not exist.`);

				const row = res.rows[0];

				this.createdAt = row.created_at;
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}

		public async Save() {
			const conn = await pgConn.connect();

			try {
				await conn.query(`UPDATE api_team SET _name = $1 WHERE id = $2`, [ this.name, this.id ]);
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}

		public static async Set(name: string, uid: number): Promise<string> {
			const conn = await pgConn.connect();

			try {
				const res = await conn.query(`INSERT INTO api_team (_name, _uid) VALUES ($1, $2) RETURNING id`, [ name, uid ]);
				const id = res.rows[0].id;

				await conn.query(`INSERT INTO api_team_member (_tid, _uid, _lvl, accepted) VALUES ($1, $2, $3, true)`, [ id, uid, Team.Role.OWNER ]);

				return res.rows[0].id;
			} catch (e) {
				logger.error(e);
			} finally {
				conn.release();
			}
		}

		
	}

	export namespace Team {
		export enum Role {
			MEMBER,
			ADMIN,
			OWNER
		}
	}


	export namespace OAuth {
		
	}
}

export { OAuthScopes }
