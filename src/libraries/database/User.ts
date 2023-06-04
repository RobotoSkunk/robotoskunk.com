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


import DotComCore from 'dotcomcore';
import { RSTime } from 'dotcomcore/dist/RSEngine';

import crypto from 'crypto';
import argon2 from 'argon2';

const DotComUser = DotComCore.User;


export class User extends DotComUser
{
	/**
	 * Creates a new user in the database.
	 * @param username The name of the new user.
	 * @param emailId The email ID of the new user.
	 * @param password The password of the new user.
	 * @param birthdate The birthdate of the new user.
	 * @returns A promise that resolves to a code that indicates the result of the operation.
	 */
	public static async Set(username: string, emailId: string, password: string, birthdate: Date): Promise<User.SignUpCode>
	{
		const client = await DotComCore.Core.Connect();

		try {
			if (!RSTime.MinimumAge(birthdate)) return User.SignUpCode.NOT_ENOUGH_AGE;
			if (await User.ExistsByHandler(username)) return User.SignUpCode.ALREADY_EXISTS;


			const hash = crypto.randomBytes(32).toString('hex');
			const pwrd = await argon2.hash(password);

			const query = await client.query(`INSERT INTO
				users (hash, username, _handler, password, birthdate)
				VALUES ($1, $2, $3, $4, $5) RETURNING id`,
				[
					hash,
					username,
					username,
					pwrd,
					birthdate
				]
			);

			await client.query(`UPDATE emails SET usrid = $1 WHERE id = $2`, [
				query.rows[0].id,
				emailId
			]);

			return User.SignUpCode.SUCCESS;
		} catch (e) {
			throw e;
		} finally {
			client.release();
		}
	}
}

export namespace User
{
	export enum SignUpCode {
		SUCCESS,
		INTERNAL_ERROR,
		ALREADY_EXISTS,
		NOT_ENOUGH_AGE,
	}
}

