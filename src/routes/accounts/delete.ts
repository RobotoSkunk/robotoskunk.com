import { logger } from '../../globals';
import env from '../../env';
import { RSCrypto, RSUtils, RSTime } from 'dotcomcore/dist/RSEngine';
import httpError from 'http-errors';
import express from 'express';
import { bruteForceLimiters, __setHeader } from '../../libraries/rateLimiter';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { Email, UserAuditLog } from '../../libraries/db';

const router = express.Router();

router.get('/', async (req, res, next) => {
	const token = await res.rs.client.token();
	if (!token) return next(httpError(403, 'You are not logged in.'));
	const user = await token.token.GetUser();
	const deleteDate = await user.GetDeleteDate();

	res.rs.html.meta = {
		'title': 'Delete Account',
		'description': 'We are sorry to see you go. Please confirm your account deletion.',
		'img': `/resources/img/meta-icon.webp`
	}

	res.rs.html.head = `<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
		<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">
		<link rel="preload" href="/resources/css/common/loader.css?v=<%= locals.env.version %>" as="style">

		<link rel="stylesheet" href="/resources/css/common/loader.css?v=<%= locals.env.version %>">
		<script defer src="/resources/js/utils.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>
		<script defer src="/resources/js/delete-account.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>
		<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;

	res.rs.error = {
		'code': 'Delete your account',
		'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
		'imgAlt': 'Alex Skunk dizzy on the floor',
		'message': ''
	};

	res.rs.error.message = `<input type="hidden" id="h-captcha" data-sitekey="${env.hcaptcha_keys.site_key}">`;

	if (!deleteDate) {
		res.rs.error.message += `Are you sure you want to delete your account? This action cannot be undone.
			<br><br>
			<button class="danger" id="open-panel">Delete my account</button>`;
	} else {
		res.rs.error.message += `Your account will be deleted on ${RSTime.Relative(deleteDate)}.<br><br>

			<button class="success" id="open-panel">Cancel account deletion</button>`;
	}


	await res.renderDefault('layout-http-error.ejs', {
		checkBannedUser: false,
		checkIfUserHasBirthdate: false,
		analyticsEnabled: false,
		useZxcvbn: false
	});
});

router.post('/', async (req, res, next) => {
	res.minify = false;

	try {
		const token = await res.rs.client.token();
		if (!token) return next(httpError(403, 'You are not logged in.'));
	
		var validRecaptcha = false;
	
		if (req.body['h-captcha-response'])
			validRecaptcha = await RSUtils.VerifyCaptcha(req.body['h-captcha-response'], env.hcaptcha_keys.secret_key);
	
		if (!validRecaptcha) return res.status(403).json({ 'message': 'Invalid captcha' });
		if (typeof req.body.password !== 'string') return next(httpError(400, 'Invalid password'));


		const user = await token.token.GetUser();
		const _res = await user.Delete(req.body.password, !Boolean(await user.GetDeleteDate()));

		if (!_res)  {
			const _limiterKey = RSCrypto.HMAC(`${req.ip}:${user.id}`, env.keys.RATE_LIMITER);

			try { await bruteForceLimiters.failedAttemptsAndIP.consume(_limiterKey); } catch (e) {
				var ms: number;
				var msg = 'Please try again later.';
				if (!(e instanceof Error)) ms = (e as RateLimiterRes).msBeforeNext;

				if (ms) {
					__setHeader(res, ms);
					msg = `Please try again in ${RSTime.ToString(ms)}.`;
				}

				res.status(429).json({ message: msg });
				return;
			}

			res.status(403).json({ message: 'Wrong password.' });
			return;
		}

		const gonnaBeDeleted = Boolean(await user.GetDeleteDate());
		if (gonnaBeDeleted) {
			await (await user.GetPrimaryEmail()).Send(Email.MailType.ACCOUNT_DELETION);

			UserAuditLog.Add(user.id, req.useragent?.source, UserAuditLog.Type.DELETE_ACCOUNT_REQUESTED, UserAuditLog.Relevance.HIGH);
		} else {
			UserAuditLog.Add(user.id, req.useragent?.source, UserAuditLog.Type.DELETE_ACCOUNT_REJECTED, UserAuditLog.Relevance.LOW);
		}


		res.status(200).send({ 'message': 'OK' });
	} catch (e) {
		logger.error(e);
		return next(httpError(500, 'An error occurred while processing your request.'));
	}
});

export = router;
