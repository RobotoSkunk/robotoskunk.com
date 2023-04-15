import express from 'express';
import { logger } from '../../globals';
import httpError from 'http-errors';
import { countries } from '../../data/countries';

const router = express.Router();


router.get('/', async (req, res, next) => {
	try {
		res.json(countries);
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	}
});

export = router;
