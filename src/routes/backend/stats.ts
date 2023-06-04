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
import { logger } from '../../globals';
import httpError from 'http-errors';
import { Analytics } from '../../libraries/analytics';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(404, 'Not found.'));

		const user = await tokenData.token.GetUser();
		if (!(user.roles.has('OWNER') || user.roles.has('ADMIN'))) return next(httpError(404, 'Not found.'));


		const data = await Analytics.GetVisits();

		// for (const key of keys) {
		// 	if (Math.random() > 0.5) continue;
		// 	const visits = ~~(Math.random() * 50000)

		// 	data[key] = {
		// 		visits,
		// 		today: ~~(Math.random() * visits)
		// 	}
		// }

		res.json({ countries: data });
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	}
});

export = router;
