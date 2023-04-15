import express from 'express';
import { conf, logger, regex } from '../../globals';
import { RSRandom, RSTime, RSMisc } from '../../libs/RSEngine';
import { Email, pgConn, User } from '../../libs/db';
import httpError from 'http-errors';
import { Schema, SignUpBody, SignUpSchema } from '../../libs/schema';
import { zxcvbn } from '../../libs/zxcvbn';
import { rateLimiterBruteForce } from '../../libs/rateLimiter';
import ejs from 'ejs';

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

		res.rs.html.head = `<script defer src="/resources/js/signup.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>
			<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>

			<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
			<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">`;

		// res.rs.form = {
		// 	'bg': `<div class="bg-image" style="background-image: url('/resources/svg/alex-skunk/sandbox.svg');"></div><div class="bg-filter"></div>`
		// };

		const today = new Date();

		const max = new Date();
		const min = new Date();
		min.setFullYear(today.getFullYear() - 130);
		max.setFullYear(today.getFullYear() - 13);


		res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/signup.ejs'), {
			key: conf.hcaptcha_keys.site_key,
			min: min.toISOString().split('T')[0],
			max: max.toISOString().split('T')[0]
		});

		await res.renderDefault('layout-api-form.ejs', {
			denyIfLoggedIn: true,
			useZxcvbn: true
		});
	} catch (e) {
		next(httpError(500, e));
	}
});

router.post('/', async (req, res, next) => {
	res.minify = false;
	await RSRandom.Wait(0, 100);
	if (req.useragent?.isBot) return next(httpError(403, 'Forbidden'));


	try { await rateLimiterBruteForce(req, res, next); } catch (e) { return next(httpError(429, 'Too many requests.')) }
	if (await res.rs.client.token()) return next(httpError(403, 'You are already logged in.'));


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

		// #region Check captcha
		var validRecaptcha = true;

		if (body['h-captcha-response'])
			validRecaptcha = await RSMisc.VerifyCaptcha(body['h-captcha-response'], conf.hcaptcha_keys.secret_key);


		if (!validRecaptcha) {
			res.status(403).json({
				'code': Errors.INVALID_CAPTCHA,
				'message': 'Invalid captcha.'
			});
			return;
		}
		// #endregion


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
		if (await User.ExistsByHandler(body.username)) {
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
		if (!await Email.Validate(body.email)) {
			return res.status(400).json({
				'code': Errors.INVALID_EMAIL,
				'message': 'Invalid email.'
			});
		}
		// #endregion


		await RSRandom.Wait(0, 150);

		if (!await Email.Exists(body.email)) {
			const response = await User.Set(body.username, body.email, body.password, bday);

			if (response === User.Code.INTERNAL_ERROR) return next(httpError(500, 'Something went wrong while signing up.'));

			if (response === User.Code.ALREADY_EXISTS) {
				return res.status(403).json({
					'code': Errors.INVALID_USERNAME,
					'message': 'Username is already taken.'
				});
			}
			if (response === User.Code.MINOR) {
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
