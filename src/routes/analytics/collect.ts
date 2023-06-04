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
import { logger, env } from '../../globals';
import httpError from 'http-errors';
import { Analytics } from '../../libraries/analytics';
import { RSUtils } from 'dotcomcore/dist/RSEngine';



const router = express.Router();

router.post('/', async (req, res, next) => {
	try {
		const dnt = req.headers['dnt'];
		if (dnt === '1' && env.production) return res.status(403).json({ message: 'DNT is enabled.', dnt: true });

		if (!req.headers['user-agent']) return next(httpError(400, 'No user agent provided.'));
		if (req.useragent.isBot) return next(httpError(403, 'Bot detected.'));

		const body: {
			screen: [ number, number ],
			referrer?: string,
			path: string,
			timezone: string
		} = req.body;

		if (typeof body.screen !== 'object' || body.screen.length !== 2) return next(httpError(400, 'Invalid screen size.'));
		if (typeof body.path !== 'string') return next(httpError(400, 'Invalid path.'));
		if (typeof body.timezone !== 'string') return next(httpError(400, 'Invalid timezone.'));

		if (typeof body.screen[0] !== 'number' || typeof body.screen[1] !== 'number') return next(httpError(400, 'Invalid screen size.'));
		if (!RSUtils.ValidURL(body.path)) return next(httpError(400, 'Invalid path.'));
		
		if (body.referrer) {
			if (typeof body.referrer !== 'string') return next(httpError(400, 'Invalid referrer.'));
			if (!RSUtils.ValidURL(body.referrer)) return next(httpError(400, 'Invalid referrer.'));

			const referrer = new URL(body.referrer);
			if (referrer.hostname === env.domain) return res.status(200).json({ message: 'IGNORED' });

			switch (referrer.hostname) {
				case 't.co': body.referrer = 'https://twitter.com'; break;
				case 'goo.gl': body.referrer = 'https://google.com'; break;
				case 'bit.ly': body.referrer = 'https://bitly.com'; break;
			}
		}

		try {
			const href = new URL(body.path);

			await Analytics.SetVisit(body.timezone, href.pathname, body.screen, body.referrer, RSUtils.AnonymizeAgent(req.useragent.source));
		} catch (e) {
			logger.error(e);
			res.status(500).json({ message: 'Internal Server Error' });

			return;
		}

		res.status(200).json({ message: 'OK' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal Server Error'));
	}
});


export = router;
