import env from './env';
import phrases from './data/phrases';

import { logger, loggerStream } from './libraries/logger';

env.production = process.env.NODE_ENV === 'production';

if (!env.production) {
	env.root = 'http://localhost';
	env.domain = 'localhost';

	env.hcaptcha_keys = {
		site_key: '10000000-ffff-ffff-ffff-000000000001',
		secret_key: '0x0000000000000000000000000000000000000000'
	}
}

phrases.push(`<!-- There's a ${(1 / (phrases.length + 1) * 100).toFixed(2)}% chance to get a phrase! -->`);

export const PORT = 8000;


// Length exception: regex can't be reduced to match 120 characters
export const regex = {
	email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	username: /^[a-zA-ZÀ-ÿ0-9 \[\]|#()_-]+$/,
	handler: /^[a-zA-Z0-9_-]+$/,
	uuid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
};




export { env, logger, phrases, loggerStream };

