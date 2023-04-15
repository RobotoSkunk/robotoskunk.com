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
