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


import express from 'express';
import ejs from 'ejs';
import httpError from 'http-errors';

import { rateLimiterBruteForce } from '../../libraries/rateLimiter';
import { env, logger, regex } from '../../globals';
import { RSUtils } from 'dotcomcore/dist/RSEngine';
import { LegacyEmail } from '../../libraries/db-esentials';


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

		const _email = await LegacyEmail.Get(email);
		if (!_email) return;

		await _email.Send(LegacyEmail.MailType.PASSWORD_RESET_REQUEST);
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error'));
	}
});


export = router;
