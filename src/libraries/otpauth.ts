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


import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = {
	window: [1, 1]
};

export class OTPAuth {
	public secret: string;
	public account: string;

	constructor (secret: string, account: string = 'anonymous') {
		this.secret = secret;
		this.account = account;
	}


	public static async genSecret(): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				resolve(authenticator.generateSecret());
			} catch (e) {
				reject(e);
			}
		});
	}

	public async getUrl(): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				resolve(authenticator.keyuri(this.account, 'robotoskunk.com', this.secret));
			} catch (e) {
				reject(e);
			}
		});
	}

	public async getQR() {
		const url = await this.getUrl();

		return await QRCode.toDataURL(url, { 'width': 256 });
	}

	public async check(code: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			try {
				resolve(authenticator.check(code, this.secret));
			} catch (e) {
				reject(e);
			}
		});
	}
}
