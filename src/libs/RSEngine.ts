import fs from 'fs';
import fsp from 'fs/promises';
import { LangCode } from './lang';
import crypto from 'crypto';


export class RSError extends Error {
	public code: number;

	constructor(message: string, code: number) {
		super(message);
		this.code = code;
	}
}

export class RSRandom {
	/**
	 * Random Integer
	 * @param x The upper range from which the random number will be selected.
	 * @returns A random integer number from [0, x];
	 */
	static Integer(x: number): number {
		return Math.floor(Math.random()*x);
	}
	/**
	 * Random Float
	 * @param x The upper range from which the random number will be selected.
	 * @returns A random float number from [0, x];
	 */
	static Float(x: number): number {
		return Math.random()*x;
	}
	/**
	 * Random Integer in a range
	 * @param x1 The lower range from which the random number will be selected.
	 * @param x2 The upper range from which the random number will be selected.
	 * @returns A random integer number from [x1, x2];
	 */
	static IntRange(x1: number, x2: number): number {
		return Math.floor(Math.random()*(x2 - x1) + x1);
	}
	/**
	 * Random Float in a range
	 * @param x1 The lower range from which the random number will be selected.
	 * @param x2 The upper range from which the random number will be selected.
	 * @returns A random float number from [x1, x2];
	 */
	static FloatRange(x1: number, x2: number): number {
		return Math.floor(Math.random()*(x2 - x1) + x1);
	}
	/**
	 * Choose a random value.
	 * @param arr An input value that can be any.
	 * @returns The choosen value.
	 */
	static Choose<T>(arr: T[]): T {
		return arr[(RSRandom.Integer(arr.length))];
	}

	/**
	 * Wait for a certain amount of time.
	 * @param min The minimum amount of time to wait.
	 * @param max The maximum amount of time to wait.
	 * @returns A promise that will be resolved after the time has passed.
	 */
	static async Wait(min: number, max: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, RSRandom.IntRange(min, max));
		});
	}

	static Shuffle<T>(arr: T[]): T[] {
		var j: number, x: T, i: number;

		for (i = arr.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = arr[i];
			arr[i] = arr[j];
			arr[j] = x;
		}

		return arr;
	}
}

export class RSMath {
	/**
	 * Mantains a number in a range.
	 * @param x The number to clamp.
	 * @param min The minimum of the range.
	 * @param max The maximum of the range.
	 * @returns The clamped number.
	 */
	static Clamp(x: number, min: number, max: number): number {
		return Math.min(Math.max(x, min), max);
	}
	/**
	 * Removes an specific element from an array.
	 * @param arr The array where the element is gonna go.
	 * @param value The element to remove.
	 * @returns The modified array.
	 */
	static ArrayRemove(arr: object[], value: any): object[] { 
		return arr.filter(function(ele){ 
			return ele != value; 
		});
	}
}

export class RSFiles {
	/**
	 * Checks if a file exists.
	 * @param filePath The file path to check.
	 * @returns True or false if the file exists or not.
	 */
	static async Exists(filePath: string): Promise<boolean> {
		var toReturn = true;
		fs.access(filePath, fs.constants.F_OK, (err) => {
			if (err) toReturn = false;
		});

		return new Promise((resolve, reject) => {
			resolve(toReturn);
		});
	}
	/**
	 * Asynchronously writes data to a file, replacing the file if it already exists.
	 * @param filePath The file path to write.
	 * @param data The data to write in.
	 * @returns True or false if the writing fails.
	 */
	static async Write(filePath: string, data: string): Promise<boolean> {
		return new Promise(async (resolve, reject) => {
			try {
				await fsp.writeFile(filePath, data);
				return resolve(true);
			} catch (err) {
				return reject(err);
			}

			resolve(false);
		});
	}
	/**
	 * Asynchronously reads the entire contents of a file.
	 * @param filePath The file path to read.
	 * @returns The file data if success or null if it fails.
	 */
	static async Read(filePath: string): Promise<string | null> {
		return new Promise(async (resolve, reject) => {
			if (await RSFiles.Exists(filePath)) {
				try {
					const data = await fsp.readFile(filePath, 'utf-8');
					resolve(data);
				} catch (err) {
					return resolve(null);
				}
			} else {
				resolve(null);
			}
		});
	}

	/**
	 * Reads a file directory.
	 * @param filePath The file path to read.
	 * @returns {Promise<string[]>} The directory files.
	 */
	// static async *ViewDirectory(filePath: string, relativePath = ''): AsyncGenerator<string, string[], any> {
	// 	const dirents = await fsp.readdir(filePath, { 'withFileTypes': true });

	// 	for (const dirent of dirents) {
	// 		const res = path.resolve(filePath, dirent.name);

	// 		if (dirent.isDirectory()) {
	// 			yield* RSFiles.ViewDirectory(res);
	// 		} else {
	// 			yield res.replace(__dirname, '.');
	// 		}
	// 	}
	// }
}

export class RSMisc {
	/**
	 * Makes the program sleep for some miliseconds.
	 * @param ms The time to wait.
	 * @returns Your mom.
	 */
	static async Sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	/**
	 * Encodes an ascii string to base64.
	 * @param text The text to be converted to.
	 * @returns The string encoded in base64.
	 */
	static async ToBase64(text: string) {
		return Buffer.from(text, 'utf8').toString('base64');
	}
	/**
	 * Decodes an ascii string to base64.
	 * @param text The text to be converted to.
	 * @returns The string decoded from base64.
	 */
	static async FromBase64(text: string) {
		return Buffer.from(text, 'base64').toString('utf8');
	}
	/**
	 * Encodes a string to base64 url safe.
	 * @param text The text to be converted to.
	 * @returns The string encoded in base64 url safe.
	 */
	static async ToBase64Url(text: string) {
		return Buffer.from(text, 'utf8').toString('base64url');
	}
	/**
	 * Decodes a string from base64 url safe.
	 * @param text The text to be converted to.
	 * @returns The string decoded from base64 url safe.
	 */
	static async FromBase64Url(text: string) {
		return Buffer.from(text, 'base64url').toString('utf8');
	}

	/**
	 * Escapes all html special characters in a string.
	 * @param text The text to be converted to.
	 * @returns The string with escaped html special characters.
	 */
	static EscapeHtml(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	/**
	 * Separates a number with commas.
	 * @param x The number to be separated.
	 * @returns The separated number.
	 */
	 static NumberWithCommas(x: number): string {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	/**
	 * Translates ms time to spanish.
	 * @param ms The time to be translated.
	 * @returns The translated time.
	 */
	static TranslateTime(ms: string): string {
		const words = {
			'second': 'segundo', 'seconds': 'segundos',
			'minute': 'minuto',  'minutes': 'minutos',
			'hour': 'hora',      'hours': 'horas',
			'day': 'día',        'days': 'días',
			'week': 'semana',    'weeks': 'semanas',
			'month': 'mes',      'months': 'meses',
			'year': 'año',       'years': 'años'
		}

		for (const word in words) {
			if (ms.includes(word))
				return `${ms.replace(word, words[word])}`;
		}

		return ms;
	}

	static AnonymizeAgent(userAgent: string): string {
		return userAgent
			.replace(/( \[FB(.*))$/g, '')
			.replace(/( V1_AND_(.*))$/g, '')
			.replace(/\/(\d+\.?)+/g, (match, p1) => { return match.split('.').map((v, i) => i === 0 ? v : '0').join('.'); });
	}

	static async VerifyCaptcha(token: string, secret: string): Promise<boolean> {
		try {
			const res = await fetch(`https://hcaptcha.com/siteverify`, {
				method: 'POST',
				body: new URLSearchParams({ 'secret': secret, 'response': token })
			});

			if (res.ok) {
				const json = await res.json();

				return json.success;
			}
		} catch (_) { }

		return false;
	}

	static EnumKey<T>(obj: T, value: any): keyof T | null {
		for (const key in obj) {
			if (obj[key] === value)
				return key;
		}

		return null;
	}

	static ValidURL(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch (_) { }

		return false;
	}
}

export class RSCrypto {
	static algo = 'sha256';

	/**
	 * Hashes a string using SHA256.
	 * @param data The string to hash.
	 * @returns The hashed string.
	 */
	static Hash(data: string): string {
		try {
			return crypto.createHash(this.algo).update(data).digest('hex');
		} catch (e) {
			throw new RSError(e.message, -1);
		}
	}

	/**
	 * Compares two strings safely.
	 * @param a The first string.
	 * @param b The second string.
	 * @returns True or false if the strings are equal.
	 */
	static Compare(a: string, b: string): boolean {
		if (a.length !== b.length) return false;

		var result = 0;

		for (var i = 0; i < a.length; i++)
			result |= a.charCodeAt(i) ^ b.charCodeAt(i);

		return result === 0;
	}

	/**
	 * Generates a random bytes string encoded in base64 url safe.
	 * @param length The length of the random bytes.
	 * @returns The random bytes string encoded in base64 url safe.
	 */
	static RandomBytes(length: number): string { return crypto.randomBytes(length).toString('base64url'); }



	public static async Encrypt(data: string, key: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			try {
				const sha256 = crypto.createHash(this.algo);
				sha256.update(key);

				const iv = crypto.randomBytes(16);
				const cipher = crypto.createCipheriv('aes-256-gcm', sha256.digest(), iv);

				const ciphertext = cipher.update(Buffer.from(data));


				resolve(Buffer.concat([iv, ciphertext, cipher.final(), cipher.getAuthTag()]).toString('base64'));
			} catch (e) {
				reject(e);
			}
		});
	}

	public static async Decrypt(data: string, key: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			try {
				const sha256 = crypto.createHash(this.algo);
				sha256.update(key);

				const dataBuffer = Buffer.from(data, 'base64');
				const iv = dataBuffer.subarray(0, 16);
				const authTag = dataBuffer.subarray(dataBuffer.length - 16);
				const ciphertext = dataBuffer.subarray(16, dataBuffer.length - 16);


				const decipher = crypto.createDecipheriv('aes-256-gcm', sha256.digest(), iv);
				decipher.setAuthTag(authTag);
				const plaintext = decipher.update(ciphertext);

				resolve(Buffer.concat([plaintext, decipher.final()]).toString());
			} catch(e) {
				reject(e);
			}
		});
	}

	public static HMAC(data: string, key: string): string {
		return crypto.createHmac('sha256', key).update(data).digest('hex');
	}

	public static async PBKDF2(data: string, salt: string, iterations: number, keylen: number): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			crypto.pbkdf2(data, salt, iterations, keylen, 'sha256', (err, derivedKey) => {
				if (err) reject(err);
				else resolve(derivedKey.toString('hex'));
			});
		});
	}
}


export class RSTime {
	private static s = 1000;
	private static m = this.s * 60;
	private static h = this.m * 60;
	private static d = this.h * 24;
	private static w = this.d * 7;
	private static M = this.d * 30;
	private static y = this.d * 365;

	public static get _SECOND_(): number { return this.s; }
	public static get _MINUTE_(): number { return this.m; }
	public static get _HOUR_(): number { return this.h; }
	public static get _DAY_(): number { return this.d; }
	public static get _WEEK_(): number { return this.w; }
	public static get _MONTH_(): number { return this.M; }
	public static get _YEAR_(): number { return this.y; }


	public static langs = {
		en: {
			n: 'now',
			s: ['second', 'seconds'],
			m: ['minute', 'minutes'],
			h: ['hour', 'hours'],
			d: ['day', 'days'],
			w: ['week', 'weeks'],
			M: ['month', 'months'],
			y: ['year', 'years'],
			ago: '$ ago'
		},
		es: {
			n: 'ahora',
			s: ['segundo', 'segundos'],
			m: ['minuto', 'minutos'],
			h: ['hora', 'horas'],
			d: ['día', 'días'],
			w: ['semana', 'semanas'],
			M: ['mes', 'meses'],
			y: ['año', 'años'],
			ago: 'hace $'
		},
		fr: {
			n: 'maintenant',
			s: ['seconde', 'secondes'],
			m: ['minute', 'minutes'],
			h: ['heure', 'heures'],
			d: ['jour', 'jours'],
			w: ['semaine', 'semaines'],
			M: ['mois', 'mois'],
			y: ['an', 'ans'],
			ago: 'il y a $'
		},
		pt: {
			n: 'agora',
			s: ['segundo', 'segundos'],
			m: ['minuto', 'minutos'],
			h: ['hora', 'horas'],
			d: ['dia', 'dias'],
			w: ['semana', 'semanas'],
			M: ['mês', 'meses'],
			y: ['ano', 'anos'],
			ago: 'há $'
		}
	}

	public static ToString(ms: number, lang: LangCode = 'en'): string {
		var langData = this.langs[lang];
		if (!langData) langData = this.langs.en;

		const t = Math.abs(ms);

		if (t >= this.y) return `${Math.round(t / this.y)} ${langData.y[+(t >= this.y * 2)]}`;
		if (t >= this.M) return `${Math.round(t / this.M)} ${langData.M[+(t >= this.M * 2)]}`;
		if (t >= this.w) return `${Math.round(t / this.w)} ${langData.w[+(t >= this.w * 2)]}`;
		if (t >= this.d) return `${Math.round(t / this.d)} ${langData.d[+(t >= this.d * 2)]}`;
		if (t >= this.h) return `${Math.round(t / this.h)} ${langData.h[+(t >= this.h * 2)]}`;
		if (t >= this.m) return `${Math.round(t / this.m)} ${langData.m[+(t >= this.m * 2)]}`;
		if (t >= this.s) return `${Math.round(t / this.s)} ${langData.s[+(t >= this.s * 2)]}`;

		return langData.n;
	}

	public static Relative(date: Date, lang: LangCode = 'en'): string {
		return RSTime.ToString(Date.now() - date.getTime(), lang);
	}

	public static RelativeAgo(date: Date, lang: LangCode = 'en'): string {
		const __tmp = RSTime.Relative(date, lang);

		if (__tmp === this.langs[lang].n) return __tmp;
		return this.langs[lang].ago.replace('$', __tmp);
	}

	public static SetTimezone(date: Date, GTM: number): Date {
		return new Date(date.getTime() + GTM * 60 * 60 * 1000);
	}

	public static MinimumAge(birthdate: Date): boolean {
		return Date.now() - birthdate.getTime() >= this.y * 13;
	}

	/**
	 * Returns the age of the user in years, but anonymously.
	 * @param birthdate The birthdate of the user.
	 */
	public static KAnonAge(birthdate: Date): number {
		const age = ~~((Date.now() - birthdate.getTime()) / this.y);

		if (age < 16) return RSRandom.IntRange(8, 15);
		if (age < 18) return RSRandom.Choose([16, 17]);
		if (age < 30) return RSRandom.IntRange(18, 29);

		return RSRandom.IntRange(30, 50);
	}
}
export namespace RSTime {
	export enum MONTH_INDEX { JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE, JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER }
}


