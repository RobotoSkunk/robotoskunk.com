import express from 'express';
import httpError from 'http-errors';
import { logger } from '../globals';
import { LegacyEmail } from '../libraries/db';
import { rateLimiterBruteForce } from '../libraries/rateLimiter';

const router = express.Router();

router.get('/:token', async (req, res, next) => {
	try { await rateLimiterBruteForce(req, res, next); } catch (e) { return next(httpError(429, 'Too many requests.')) }

	const tokenData = await res.rs.client.token();
	var redirect = tokenData ? '/accounts/settings' : '/accounts/signin?verified=1';

	if (req.useragent?.isBot) return next(httpError(403, 'Forbidden'));

	try {
		if (await LegacyEmail.Verify(req.params.token)) return res.redirect(redirect);

		next(httpError(403, 'Forbidden'));
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	}
});

export = router;
