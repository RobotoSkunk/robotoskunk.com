import express from 'express';
import { logger } from '../globals';
import { RSUtils } from 'dotcomcore/dist/RSEngine';
import { CSP } from '../libraries/schema';
import httpError from 'http-errors';
import { pgConn } from '../libraries/db';
import stringify from 'safe-stable-stringify';

// file deepcode ignore HTTPSourceWithUncheckedType: Schema.validate() is used


const router = express.Router();

router.post('/', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		if (req.useragent?.isBot) return next(httpError(403, 'Forbidden'));

		const body: CSP = req.body;
		if (typeof body['csp-report'] !== 'object') return next(httpError(400, 'Invalid CSP report'));
		if (typeof body['csp-report']['blocked-uri'] !== 'string') return next(httpError(400, 'Invalid CSP report'));


		body['csp-report']['blocked-uri'] = body['csp-report']['blocked-uri'].trim();
		const ignoredDomains = [
			'https://fonts.googleapis.com',
			'http://localhost',
			'chrome://',
			'chromeinvoke://',
			'chromeinvokeimmediate://',
			'webviewprogressproxy://',
			'mbinit://',
			'http://127.0.0.1',
			'resource://',
			'jar:file:///'
		];

		for (const domain of ignoredDomains) {
			if (body['csp-report']['blocked-uri'].startsWith(domain)) return res.status(200);
		}


		const report = Object.assign({
			'user-agent': RSUtils.AnonymizeAgent(req.headers['user-agent']),
		}, req.body);

		const _res = await conn.query('INSERT INTO csp_reports (_data) VALUES ($1) RETURNING id', [ stringify(report) ]);

		logger.error(`CSP violation, check the database for more information. (Case ${ _res.rows[0].id })`);
		res.status(200);
	} catch (e) {
		next(httpError(500, e));
	} finally {
		conn.release();
	}
});

export = router;
