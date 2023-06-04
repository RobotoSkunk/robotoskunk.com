import express from 'express';
import ejs from 'ejs';
import httpError from 'http-errors';

import { rateLimiterBruteForce } from '../../libraries/rateLimiter';
import { env, logger, regex } from '../../globals';
import { RSUtils } from 'dotcomcore/dist/RSEngine';
import { Email } from '../../libraries/db-esentials';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (tokenData) return next(httpError(403, 'Unauthorized'));

		res.rs.html.meta.setSubtitle('Forgot password');
		res.rs.html.head = `<script defer src="/resources/js/forgot-password.js?v=${env.version}" nonce="${res.rs.server.nonce}"></script>
			<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;


		res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/forgot-password.ejs'), {
			key: env.hcaptcha_keys.site_key
		});

		res.renderDefault('layout-api-form.ejs');
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error'));
	}
});

router.post('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (tokenData) return next(httpError(403, 'Unauthorized'));

		try { await rateLimiterBruteForce(req, res, next); } catch (e) { return next(httpError(429, 'Too many requests.')) }

		if (typeof req.body['h-captcha-response'] !== 'string') return next(httpError(400, 'Bad request'));
		if (!await RSUtils.VerifyCaptcha(req.body['h-captcha-response'], env.hcaptcha_keys.secret_key)) return next(httpError(400, 'Bad request'));

		if (typeof req.body.email !== 'string') return next(httpError(400, 'Bad request'));
		const email = req.body.email.trim().toLowerCase();

		if (!regex.email.test(email))
			return res.status(400).json({ code: 0, message: 'Invalid email address.' });

		res.status(200).json({ code: 1, message: 'OK' });

		const _email = await Email.Get(email);
		if (!_email) return;

		await _email.Send(Email.MailType.PASSWORD_RESET_REQUEST);
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error'));
	}
});


export = router;
