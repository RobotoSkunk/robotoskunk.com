import express from 'express';
import ejs from 'ejs';
import httpError from 'http-errors';

import { bruteForceLimiters, rateLimiterBruteForce, __setHeader } from '../../libs/rateLimiter';
import { Email, PasswordToken, User, UserAuditLog } from '../../libs/db';
import { conf, logger } from '../../globals';
import { zxcvbn } from '@zxcvbn-ts/core';
import { RSCrypto, RSMisc, RSTime } from '../../libs/RSEngine';
import { RateLimiterRes } from 'rate-limiter-flexible';



const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) {
			if (typeof req.query.token !== 'string') return next(httpError(403, 'Unauthorized'));

			const tok = await PasswordToken.Get(req.query.token);
			if (!tok) return next(httpError(403, 'Unauthorized'));
			if (!await tok.Authorize(req.query.token)) return next(httpError(403, 'Unauthorized'));
		}
		
		res.rs.html.meta.setSubtitle('Change password');
		res.rs.html.head = `<script defer src="/resources/js/reset-password.js?v=${conf.version}" nonce="${res.rs.server.nonce}"></script>
			<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>

			<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
			<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">`;


		res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/change-password.ejs'), {
			isLogged: !!tokenData,
			csrf: tokenData ? await tokenData.token.GenerateCSRF() : '',
			token: req.query.token,
			key: conf.hcaptcha_keys.site_key
		});

		res.renderDefault('layout-api-form.ejs', { useZxcvbn: true });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error'));
	}
});

router.post('/', async (req, res, next) => {
	try { await rateLimiterBruteForce(req, res, next); } catch (e) { return next(httpError(429, 'Too many requests.')) }

	if (typeof req.body['h-captcha-response'] !== 'string') return next(httpError(400, 'Bad request'));
	if (!await RSMisc.VerifyCaptcha(req.body['h-captcha-response'], conf.hcaptcha_keys.secret_key)) return next(httpError(400, 'Bad request'));


	try {
		if (typeof req.body.password !== 'string') return next(httpError(400, 'Bad request'));

		const tokenData = await res.rs.client.token();
		var tok: PasswordToken | null = null;
		var user: User | null = null;

		if (!tokenData) {
			if (typeof req.body.token !== 'string') return next(httpError(403, 'Unauthorized'));

			tok = await PasswordToken.Get(req.body.token);
			if (!tok) return next(httpError(403, 'Unauthorized'));
			if (!await tok.Authorize(req.body.token)) return next(httpError(403, 'Unauthorized'));

			user = await User.GetById(tok.uid);
		} else {
			if (typeof req.body.csrf !== 'string' || typeof req.body['old-password'] !== 'string') return next(httpError(403, 'Unauthorized'));
			if (!await tokenData.token.ValidateCSRF(req.body.csrf)) return next(httpError(403, 'Unauthorized'));
			
			user = await tokenData.token.GetUser();
			const _limiterKey = RSCrypto.HMAC(`${req.ip}:${user.id}`, conf.keys.RATE_LIMITER);

			try {
				const r = await bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);

				if (r !== null) {
					if (r.consumedPoints > bruteForceLimiters.failedAttemptsAndIP.points) {
						var ms = r.msBeforeNext;
						__setHeader(res, ms);
						return res.status(429).json({ message: `Too many failed attempts. Please try again in ${RSTime.ToString(ms)}.` });
					}
				}
			} catch (_) { }

			if (!await user.VerifyPassword(req.body['old-password'])) {
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
							UserAuditLog.Type.FAILED_PASSWORD_CHANGE,
							UserAuditLog.Relevance.HIGH
						);
					} catch (e) { logger.error(e); }

					return res.status(429).json({
						'code': 0,
						'message': 'Too many failed attempts. ' + msg
					});
				}

				return res.status(400).json({ 'code': 0, 'message': 'Wrong password.' });
			}
		}

		const password: string = req.body.password;

		if (zxcvbn(password).score <= 2)
			return res.status(400).json({ 'code': 0, 'message': 'Password is too weak.' });

		await user.ChangePassword(password);
		if (tok) await tok.Delete();
	
		try {
			await UserAuditLog.Add(
				user.id,
				req.useragent?.source,
				UserAuditLog.Type.PASSWORD_CHANGE,
				UserAuditLog.Relevance.MEDIUM
			);

			const email = await user.GetPrimaryEmail();
			await email.Send(Email.MailType.PASSWORD_RESET);
		} catch (e) { logger.error(e); }

		res.status(200).json({ 'code': 1, 'message': 'Password changed.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error'));
	}
});


export = router;
