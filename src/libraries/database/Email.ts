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


import DotComCore, { IEmail } from 'dotcomcore';
import { RSCrypto } from 'dotcomcore/dist/RSEngine';
import { User } from './User';


const DotComEmail = DotComCore.Email;


export class Email extends DotComEmail
{	
	// #region Methods to prevent stupid TypeScript errors.
	constructor(email: IEmail)
	{
		super(email);
	}

	public static async GetById(id: string)
	{
		const email = await super.GetById(id);
		return email ? new Email(email) : null;
	}

	public static async Get(email: string): Promise<Email>
	{
		const emailObj = await super.Get(email);
		return emailObj ? new Email(emailObj) : null;
	}
	// #endregion

	/**
	 * Creates a new email address in the database.
	 * @param email The email address to add.
	 * @param type The type of email address.
	 * @param userId The user ID to associate the email address with, if any.
	 * @returns A promise that resolves when the email address has been added.
	 */
	public static async Set(email: string, type: Email.Type = Email.Type.PRIMARY, userId?: string): Promise<void>
	{
		const client = await DotComCore.Core.Connect();

		try {
			const hash = await super._HMAC(email);
			var encryptedEmail: string;

			// If the user doesn't exist, use the main encryption key.
			if (!userId) {
				const encryptionKey = await RSCrypto.PBKDF2(DotComCore.Core.encryptionKey, hash, 1000, 32);
				encryptedEmail = await RSCrypto.Encrypt(email, encryptionKey);

			} else {
				// Otherwise, use the user's encryption key.

				const user = await User.GetById(userId);
				encryptedEmail = await RSCrypto.Encrypt(email, await user.GetCryptoKey());
			}


			await client.query(`INSERT INTO emails (hash, email, usrid, refer) VALUES ($1, $2, $3, $4)`, [
				hash,
				encryptedEmail,
				userId || null,
				type
			]);

			return;
		} catch (e) {
			throw e;
		} finally {
			client.release();
		}
	}

	/**
	 * Deletes the email address from the database.
	 */
	public async Delete(): Promise<void>
	{
		const client = await DotComCore.Core.Connect();

		try {
			await client.query(`DELETE FROM emails WHERE id = $1`, [ this.id ]);
			return;
		} catch (e) {
			throw e;
		} finally {
			client.release();
		}
	}

}

export namespace Email
{
	export enum Type {
		PRIMARY,
		CONTACT,
		SECONDARY,
	}
}
