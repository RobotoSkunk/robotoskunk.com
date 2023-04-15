export type Schema = {
	fields: {
		[key: string]: string;
	},
	required?: string[];
}

export namespace Schema {
	export const validate = (schema: Schema, data: any): boolean => {
		if (schema.required) {
			for (const field of schema.required) {
				if (data[field] === undefined) return false;
			}
		}
	
		for (const field in schema.fields) {
			if (data[field] !== undefined) {
				if (typeof data[field] !== schema.fields[field]) return false;
			}
		}
	
		return true;
	}

	export const validURI = (uri: string): boolean => {
		try {
			new URL(uri);
			return true;
		} catch (e) {
			return false;
		}
	}
}


export interface Visit {
	country: string;
	url: string;
	referrer: string;
	screen: {
		x: number;
		y: number;
	};
	browser: string;
	os: string;
	is_mobile: boolean;
	created_at: Date;
}

export interface Collected {
	url: string;
	userAgent: string;
	displaySize: {
		x: number;
		y: number;
	};
	referrer: string;
	ip: string;
}


export interface CollectBody {
	url: string;
	displaySize: {
		x: number;
		y: number;
	};
	referrer: string;
}

export const CollectSchema = {
	fields: {
		url: 'string',
		displaySize: 'object',
		referrer: 'string',
	},
	required: ['url', 'displaySize']
}

export const PointSchema = {
	fields: {
		x: 'number',
		y: 'number',
	},
	required: ['x', 'y']
}


export interface SignInBody {
	email: string;
	password: string;
	'h-captcha-response': string;
	remember?: string;
	// twofa?: string;
}

export const SignInSchema = {
	fields: {
		email: 'string',
		password: 'string',
		'h-captcha-response': 'string',
		remember: 'string',
		twofa: 'string'
	},
	required: ['email', 'password', 'h-captcha-response']
}

export interface SignUpBody {
	username: string;
	email: string;
	password: string;
	'h-captcha-response': string;
	birthdate: number;
}

export const SignUpSchema = {
	fields: {
		username: 'string',
		email: 'string',
		password: 'string',
		'h-captcha-response': 'string',
		birthdate: 'number'
	},
	required: ['username', 'email', 'password', 'h-captcha-response', 'birthdate']
}


export interface CSP {
	'csp-report': {
		'blocked-uri': string,
		'column-number': number,
		'document-uri': string,
		'line-number': number,
		'original-policy': string,
		'referrer': string,
		'script-sample': string,
		'source-file': string,
		'violated-directive': string
	}
}


// export const CSPReportSchema = {
// 	fields: {
// 		'blocked-uri': 'string',
// 		'column-number': 'number',
// 		'document-uri': 'string',
// 		'line-number': 'number',
// 		'original-policy': 'string',
// 		'referrer': 'string',
// 		'script-sample': 'string',
// 		'source-file': 'string',
// 		'violated-directive': 'string'
// 	},
// 	required: [
// 		'blocked-uri',
// 		'column-number',
// 		'document-uri',
// 		'line-number',
// 		'original-policy',
// 		'source-file',
// 		'violated-directive'
// 	]
// }
