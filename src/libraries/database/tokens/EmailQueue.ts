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
import { Email } from '../Email';
const TokenBase = DotComCore.TokenBase;


export class EmailQueue extends TokenBase
{
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
}
