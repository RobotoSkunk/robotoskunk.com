import express from 'express';
import { env, logger, regex } from '../../globals';
import { RSRandom, RSUtils, RSCrypto, RSTime } from 'dotcomcore/dist/RSEngine';
import { Email, User, UserAuditLog, UserToken } from '../../libraries/db';
import httpError from 'http-errors';
import { Schema, SignInBody, SignInSchema } from '../../libraries/schema';
import { bruteForceLimiters, rateLimiterBruteForce, __httpError, __setHeader } from '../../libraries/rateLimiter';
import { RateLimiterRes } from 'rate-limiter-flexible';
import ejs from 'ejs';

const router = express.Router();

enum Errors {
	SUCCESS,
	INVALID_BODY,
	INVALID_EMAIL,
	INVALID_RECAPTCHA,
	INVALID_EMAIL_OR_PASSWORD,
	ACCOUNT_LOCKED_BY_BRUTE_FORCE,
	REQUIRE_2FA,
	INVALID_2FA
};

// file deepcode ignore HTTPSourceWithUncheckedType: The type of the object is being checked by Schema.validate()



router.get('/', async (req, res, next) => {
	try {
		const token = await UserToken.SimpleAuth(req.cookies.auth_token || '');
		res.rs.html.meta.description = 'Sign in with your RobotoSkunk account.';

		if (!token) {
			res.rs.html.meta.setSubtitle('Sign In');

			res.rs.html.head = `<script defer src="/resources/js/signin.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>
				<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>

				<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
				<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">`;

			// res.rs.form = {
			// 	'bg': `<div class="bg-image" style="background-image: url('/resources/svg/alex-skunk/sandbox.svg');"></div><div class="bg-filter"></div>`
			// };

			res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/signin.ejs'), { key: env.hcaptcha_keys.site_key });

		} else {
			res.rs.html.meta.setSubtitle('Two-Factor Authentication');
			res.rs.html.head = `<script defer src="/resources/js/signin-2fa.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;

			res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/signin-2fa.ejs'), {
				'csrf': await token.GenerateCSRF(),
			});
		}


		await res.renderDefault('layout-api-form.ejs', { denyIfLoggedIn: true });
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


	try {
		const body: SignInBody = req.body;

		if (!Schema.validate(SignInSchema, body)) {
			return res.status(400).json({
				'code': Errors.INVALID_BODY,
				'message': 'Something went wrong. Refresh the page and try again.'
			});
		}

		// #region Check captcha
		var validRecaptcha = false;

		if (body['h-captcha-response'])
			validRecaptcha = await RSUtils.VerifyCaptcha(body['h-captcha-response'], env.hcaptcha_keys.secret_key);


		if (!validRecaptcha) {
			res.status(403).json({
				'code': Errors.INVALID_RECAPTCHA,
				'message': 'Invalid captcha.'
			});
			return;
		}
		// #endregion


		// #region Validate fields
		body.email = body.email.toLowerCase().trim();

		if (!regex.email.test(body.email)) {
			res.status(400).json({
				'code': Errors.INVALID_EMAIL,
				'message': 'Invalid email.'
			});
			return;
		}
		// #endregion


		const _limiterKey = RSCrypto.HMAC(`${req.ip}:${body.email}`, env.keys.RATE_LIMITER);
		try {
			const r = await bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);

			if (r !== null) {
				if (r.consumedPoints > bruteForceLimiters.failedAttemptsAndIP.points) {
					__setHeader(res, r.msBeforeNext);
	
					res.status(400).json({
						'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
						'message': `You have been locked out due to too many failed attempts. Please try again in ${RSTime.ToString(r.msBeforeNext)}.`
					});
					return;
				}
			}

		} catch (_) { }

		const response = await User.Auth(body.email, body.password);

		switch (response.code) {
			case User.Code.INTERNAL_ERROR: next(httpError(500, 'Something went wrong while signing in.')); return;
			// case User.Code.REQUIRE_2FA: return res.status(400).json({ 'code': Errors.REQUIRE_2FA });

			// case User.Code.INVALID_2FA:
			case User.Code.INVALID_EMAIL_OR_PASSWORD: {
				try {
					await bruteForceLimiters.failedAttemptsAndIP.consume(_limiterKey);
				} catch (e) {
					var ms: number;
					var msg = 'Please try again later.';
					if (!(e instanceof Error)) ms = (e as RateLimiterRes).msBeforeNext;

					if (ms) {
						__setHeader(res, ms);
						msg = `Please try again in ${RSTime.ToString(ms)}.`;
					}

					try {
						const email = await Email.Get(body.email);

						if (email) {
							await UserAuditLog.Add(
								email.userId,
								req.useragent?.source,
								UserAuditLog.Type.FAILED_LOGIN,
								UserAuditLog.Relevance.HIGH
								// { twofa: Boolean(body.twofa) }
							);
						}
					} catch (e) { logger.error(e); }

					return res.status(403).json({
						'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
						'message': 'You have been locked out due to too many failed attempts. ' + msg
					});
				}

				// if (response.code === User.Code.INVALID_2FA) {
				// 	return res.status(403).json({
				// 		'code': Errors.INVALID_2FA,
				// 		'message': 'Invalid two-factor authentication code.'
				// 	});
				// }

				return res.status(403).json({
					'code': Errors.INVALID_EMAIL_OR_PASSWORD,
					'message': 'Wrong email or password.'
				});
			}
		}

		const twofactor = await response.user.Enabled2FA();

		const tokenResponse = await UserToken.Set(response.user.id, req.body.remember == 'on', req.headers['user-agent'], !twofactor);
		if (!tokenResponse) { next(httpError(500, 'Something went wrong while registering token.')); return; }

		await UserAuditLog.Add(
			response.user.id,
			req.useragent?.source,
			UserAuditLog.Type.LOGIN,
			UserAuditLog.Relevance.MEDIUM,
			{ needs2FA: twofactor }
			// { twofa: Boolean(body.twofa) }
		);


		await bruteForceLimiters.failedAttemptsAndIP.delete(_limiterKey);
		res.status(200).cookie('auth_token', tokenResponse.text, tokenResponse.token.GetCookieParams(res.rs.client.isOnion)).json({
			code: 0,
			message: 'OK',
			twofa: twofactor
		});
	} catch (e) {
		logger.error(e);
		next(httpError(500, e.message));
	}
});

router.post('/twofa', async (req, res, next) => {
	if (req.useragent?.isBot) return next(httpError(403, 'Forbidden'));
	try { await rateLimiterBruteForce(req, res, next); } catch (e) { return next(httpError(429, 'Too many requests.')) }

	const token = await UserToken.SimpleAuth(req.cookies.auth_token || '');
	if (!token) return next(httpError(403, 'Forbidden'));

	const body: { twofa: string, csrf: string } = req.body;
	if (typeof body.twofa !== 'string' || typeof body.csrf !== 'string') return next(httpError(400, 'Invalid body.'));
	if (isNaN(Number.parseInt(body.twofa))) return res.status(400).json({ message: 'The code must be a number.' });

	if (!await token.ValidateCSRF(body.csrf)) return next(httpError(403, 'Forbidden'));


	const user = await token.GetUser(), twofactor = await user.Enabled2FA();
	if (!twofactor) return next(httpError(403, 'Forbidden'));


	const _limiterKey = RSCrypto.HMAC(`${req.ip}:${user.id}`, env.keys.RATE_LIMITER);

	try {
		const r = await bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);

		if (r !== null) {
			if (r.consumedPoints > bruteForceLimiters.failedAttemptsAndIP.points) {
				__setHeader(res, r.msBeforeNext);

				return res.status(429).json({
					'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
					'message': `You have been locked out due to too many failed attempts. Please try again in ${RSTime.ToString(r.msBeforeNext)}.`
				});
			}
		}
	} catch (_) { }

	if (!await user.Verify2FA(body.twofa)) {
		try {
			await bruteForceLimiters.failedAttemptsAndIP.consume(_limiterKey);
		} catch (e) {
			var ms: number;
			var msg = 'Please try again later.';
			if (!(e instanceof Error)) ms = (e as RateLimiterRes).msBeforeNext;

			if (ms) {
				__setHeader(res, ms);
				msg = `Please try again in ${RSTime.ToString(ms)}.`;
			}

			try {
				await UserAuditLog.Add(
					user.id,
					req.useragent?.source,
					UserAuditLog.Type.FAILED_LOGIN,
					UserAuditLog.Relevance.HIGH,
					{ twofa: true }
				);
			} catch (e) { logger.error(e); }

			return res.status(403).json({
				'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
				'message': 'You have been locked out due to too many failed attempts. ' + msg
			});
		}

		return res.status(403).json({
			'code': Errors.INVALID_2FA,
			'message': 'Wrong two-factor authentication code.'
		});
	}

	await token.TwoFactorAuth();
	await UserAuditLog.Add(
		user.id,
		req.useragent?.source,
		UserAuditLog.Type.LOGIN,
		UserAuditLog.Relevance.MEDIUM
	);

	await bruteForceLimiters.failedAttemptsAndIP.delete(_limiterKey);
	res.status(200).json({
		code: 0,
		message: 'OK'
	});
});

export = router;
