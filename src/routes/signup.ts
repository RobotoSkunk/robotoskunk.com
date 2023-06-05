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


import express, { NextFunction, Request, Response } from 'express';
import { env, logger, regex } from '../globals';
import { RSRandom, RSTime, RSUtils } from 'dotcomcore/dist/RSEngine';
import { LegacyEmail, pgConn, LegacyUser } from '../libraries/db';
import httpError from 'http-errors';
import { Schema, SignUpBody, SignUpSchema } from '../libraries/schema';
import { zxcvbn } from '../libraries/zxcvbn';
import { rateLimiterBruteForce } from '../libraries/rateLimiter';
import ejs from 'ejs';

import { EmailQueue } from '../libraries/database/tokens/EmailQueue';
import DotComCore from 'dotcomcore';
import { Email } from '../libraries/database/Email';


const router = express.Router();

enum Errors {
	SUCCESS,
	INVALID_BODY,
	INVALID_EMAIL,
	INVALID_USERNAME,
	INVALID_PASSWORD,
	INVALID_CAPTCHA,
	INVALID_BIRTHDATE
}

// file deepcode ignore HTTPSourceWithUncheckedType: The type of the object is being checked by Schema.validate()



router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('Sign Up');
		res.rs.html.meta.description = 'Sign up for an account';

		if (req.query.token) {
			if (!(await EmailQueue.ValidateToken(req.query.token as string))) {
				return next(httpError(403, 'Invalid token.'));
			}

			const today = new Date();

			const max = new Date();
			const min = new Date();
			min.setFullYear(today.getFullYear() - 130);
			max.setFullYear(today.getFullYear() - 13);


			res.rs.html.body = await ejs.renderFile(res.getEJSPath('signup-last-step.ejs'), {
				key: env.hcaptcha_keys.site_key,
				min: min.toISOString().split('T')[0],
				max: max.toISOString().split('T')[0]
			});

			await res.renderDefault('layout-api-form.ejs', {
				denyIfLoggedIn: true,
				useZxcvbn: true
			});

			return;
		}

		res.addToHead(
			{
				type: 'js',
				source: 'https://js.hcaptcha.com/1/api.js'
			}, {
				type: 'js',
				source: `/resources/js/signup-first-step.js`
			}, {
				type: 'link',
				rel: 'preload',
				source: '/resources/svg/eye-enable.svg',
				as: 'image',
				mimeType: 'image/svg+xml'
			}, {
				type: 'link',
				rel: 'preload',
				source: '/resources/svg/eye-disable.svg',
				as: 'image',
				mimeType: 'image/svg+xml'
			}
		);

		// res.rs.form = {
		// 	'bg': `<div class="bg-image" style="background-image: url('/resources/svg/alex-skunk/sandbox.svg');"></div><div class="bg-filter"></div>`
		// };


		res.rs.html.body = await ejs.renderFile(res.getEJSPath('signup-first-step.ejs'), {
			key: env.hcaptcha_keys.site_key
		});

		await res.renderDefault('layout-api-form.ejs', {
			denyIfLoggedIn: true
		});
	} catch (e) {
		next(httpError(500, e));
	}
});


/**
 * Checks if the request is valid.
 */
async function genericChecker(req: Request, res: Response, next: NextFunction): Promise<number>
{
	res.minify = false;
	await RSRandom.Wait(0, 100);
	if (req.useragent?.isBot) return 403;

	try {
		await rateLimiterBruteForce(req, res, next);
	} catch (e) {
		return 429
	}

	if (await res.rs.client.token()) {
		return 403
	}


	const body: SignUpBody = req.body;

	// #region Check captcha
	var validRecaptcha = true;

	if (body['h-captcha-response']) {
		validRecaptcha = await RSUtils.VerifyCaptcha(body['h-captcha-response'], env.hcaptcha_keys.secret_key);
	}


	if (!validRecaptcha) {
		res.status(403).json({
			'code': Errors.INVALID_CAPTCHA,
			'message': 'Invalid captcha.'
		});
		return -1;
	}
	// #endregion

	return 0;
}


router.post('/email', async (req, res, next) =>
{
	try {
		const result = await genericChecker(req, res, next);

		if (result === -1) {
			return;
		}
		if (result !== 0) {
			return next(httpError(result, 'Something went wrong.'));
		}
	
		const client = await DotComCore.Core.Connect();
	
		try {
			if (!(await Email.VerifyIfValid(req.body.email))) {
				return res.status(400).json({
					'code': Errors.INVALID_EMAIL,
					'message': 'Invalid email.'
				});
			}

			res.status(200).json({
				'code': 0,
				'message': 'OK'
			});
		} catch (e) {
			logger.error(e);
			next(httpError(500, e));
		} finally {
			client.release();
		}
	} catch (e) {
		next(httpError(500, e));
	}
});


router.post('/', async (req, res, next) => {
	const result = await genericChecker(req, res, next);

	if (result === -1) {
		return;
	}
	if (result !== 0) {
		return next(httpError(result, 'Something went wrong.'));
	}


	const client = await pgConn.connect();
	
	try {
		const body: SignUpBody = req.body;
		if (typeof body.birthdate === 'string')
			body.birthdate = Number.parseInt(body.birthdate);

		if (!Schema.validate(SignUpSchema, body)) {
			return res.status(400).json({
				'code': Errors.INVALID_BODY,
				'message': 'Something went wrong. Refresh the page and try again.'
			});
		}


		// #region Check user data
		body.username = body.username.trim();
		body.email = body.email.trim();
		const bday = new Date(body.birthdate);

		if (!bday) {
			res.status(400).json({
				'code': Errors.INVALID_BIRTHDATE,
				'message': 'Invalid birthdate.'
			});
			return;
		}

		bday.setHours(12, 0, 0, 0);
		if (!RSTime.MinimumAge(bday)) {
			return res.status(400).json({
				'code': Errors.INVALID_BIRTHDATE,
				'message': 'You must be at least 13 years old.'
			});
		}
		if (bday.getTime() < Date.now() - RSTime._YEAR_ * 130) {
			return res.status(400).json({
				'code': Errors.INVALID_BIRTHDATE,
				'message': 'Really funny, but you are not that old.'
			});
		}
		if (!regex.handler.test(body.username)) {
			return res.status(400).json({
				'code': Errors.INVALID_USERNAME,
				'message': 'Username can only contain letters, numbers, underscores and dashes.'
			});
		}
		if (body.username.length < 3 || body.username.length > 16) {
			return res.status(400).json({
				'code': Errors.INVALID_USERNAME,
				'message': 'Username must be between 3 and 16 characters.'
			});
		}
		if (await LegacyUser.ExistsByHandler(body.username)) {
			return res.status(400).json({
				'code': Errors.INVALID_USERNAME,
				'message': 'Username is already taken.'
			});
		}
		if (zxcvbn(body.password).score <= 2) {
			return res.status(400).json({
				'code': Errors.INVALID_PASSWORD,
				'message': 'Password is too weak.'
			});
		}
		if (!await LegacyEmail.Validate(body.email)) {
			return res.status(400).json({
				'code': Errors.INVALID_EMAIL,
				'message': 'Invalid email.'
			});
		}
		// #endregion


		await RSRandom.Wait(0, 150);

		if (!await LegacyEmail.Exists(body.email)) {
			const response = await LegacyUser.Set(body.username, body.email, body.password, bday);

			if (response === LegacyUser.Code.INTERNAL_ERROR) return next(httpError(500, 'Something went wrong while signing up.'));

			if (response === LegacyUser.Code.ALREADY_EXISTS) {
				return res.status(403).json({
					'code': Errors.INVALID_USERNAME,
					'message': 'Username is already taken.'
				});
			}
			if (response === LegacyUser.Code.MINOR) {
				return res.status(403).json({
					'code': Errors.INVALID_BIRTHDATE,
					'message': 'You must be at least 8 years old.'
				});
			}
		}


		res.status(200).json({
			'code': 0,
			'message': 'OK'
		})
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	} finally {
		client.release();
	}
});

export = router;
