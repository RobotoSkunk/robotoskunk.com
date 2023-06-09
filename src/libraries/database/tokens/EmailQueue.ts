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


import DotComCore, { ITokenBase, TokenBase } from 'dotcomcore';
import { Email } from '../Email';

export interface IEmailQueue extends ITokenBase
{
	emailId: string;
}


export class EmailQueue extends TokenBase
{
	// #region Methods to prevent stupid TypeScript errors.
	constructor(id: string, validator: string, createdAt: Date, expiresAt: Date)
	{
		super(id, validator, createdAt, expiresAt);
	}

	public static async GetToken(token: string): Promise<EmailQueue> {
		const _token = await super.GetToken(token);
		return _token ? new EmailQueue(_token.id, _token.validator, _token.createdAt, _token.expiresAt) : null;
	}
	// #endregion

	/**
	 * Gets the email of a token.
	 */
	public async GetEmail(): Promise<Email>
	{
		const client = await DotComCore.Core.Connect();

		try {
			const query = await client.query(`SELECT eid FROM verify_email_queue WHERE id = $1`, [ this.id ]);
			const emailId = query.rows[0].eid;

			const email = await Email.GetById(emailId);
			return email;
		} catch (e) {
			throw e;
		} finally {
			client.release();
		}
	}

	/**
	 * Adds a new email token to the database.
	 * @param email The email to associate with the token.
	 * @returns The new generated token.
	 */
	public static async Add(email: Email): Promise<IEmailQueue>
	{
		const client = await DotComCore.Core.Connect();

		try {
			const token = TokenBase.GenerateToken() as IEmailQueue;

			const query = await client.query(`INSERT INTO
				verify_email_queue (id, val_key, eid)
				VALUES ($1, $2, $3)
				RETURNING created_at, expires_at`,
				[
					token.id,
					token.validator,
					email.id
				]
			);

			
			token.createdAt = query.rows[0].created_at;
			token.expiresAt = query.rows[0].expires_at;
			token.emailId = email.id;

			return token;
		} catch (e) {
			throw e;
		} finally {
			client.release();
		}
	}
}
