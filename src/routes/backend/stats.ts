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
