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


import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';

var jsonPackage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));


const env = {
	'production': process.env.NODE_ENV === 'production',
	'version': jsonPackage.version as string,
	'root': 'https://robotoskunk.com',
	'domain': 'robotoskunk.com',
	'database': {
		'host': process.env.PSQL_HOST,
		'user': process.env.PSQL_USER,
		'password': process.env.PSQL_PASSWORD,
		'database': process.env.PSQL_DB
	},
	'rateLimiterDatabase': {
		'host': process.env.RTLM_HOST,
		'user': process.env.RTLM_USER,
		'password': process.env.RTLM_PASSWORD,
		'database': process.env.RTLM_DB
	},
	'emails': {
		'noreply': {
			'host': process.env.EMAIL_HOST,
			'port': parseInt(process.env.EMAIL_PORT),
			'secure': process.env.EMAIL_SECURE === "1",
			'name': process.env.EMAIL_NAME,
			'auth': {
				'user': process.env.EMAIL_AUTH_USER,
				'pass': process.env.EMAIL_AUTH_PASSWORD
			}
		}
	},
	'robotoskunk': {
		'social': {
			'facebook': 'https://facebook.com/RobotoSkunk',
			'discord': 'https://discord.gg/RT8uayccTt',
			'twitter': 'https://twitter.com/RobotoSkunk',
			'github': 'https://github.com/RobotoSkunk',
			'youtube': 'https://www.youtube.com/robotoskunk',
			'newgrounds': 'https://robotoskunk.newgrounds.com',
			'instagram': 'https://www.instagram.com/robotoskunk',
			'picarto': 'https://picarto.tv/RobotoSkunk',
			'deviantart': 'https://www.deviantart.com/robotogamer98',
			'gamejolt': 'https://gamejolt.com/@RobotoSkunk',
			'reddit': 'https://www.reddit.com/user/RealRobotoSkunk',
			'twitch': 'https://www.twitch.tv/robotoskunk'
		}
	},
	'hcaptcha_keys': {
		'site_key': process.env.HCAPTCHA_SITE_KEY,
		'secret_key': process.env.HCAPTCHA_SECRET_KEY
	},
	'paypal': {
		'id': process.env.PAYPAL_ID,
		'secret': process.env.PAYPAL_SECRET
	},
	'commissions': {
		'isOpen': true,
		'slotsLimit': 4,
		'discount': 0
	},
	'keys': {
		'MASTER': process.env.MASTER_KEY,
		'HMAC': process.env.HMAC_KEY,
		'SALT': process.env.SALT_KEY,
		'RATE_LIMITER': process.env.RATE_LIMITER_KEY
	}
};


export default env;
jsonPackage = undefined;
