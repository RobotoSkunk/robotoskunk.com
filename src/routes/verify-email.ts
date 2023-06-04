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
