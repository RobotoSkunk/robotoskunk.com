import express from 'express';
import ejs from 'ejs';

import { conf } from '../globals';
import { pgConn } from '../libs/db';

const router = express.Router();
import httpError from 'http-errors';

router.get('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(404, 'Not found.'));

		const user = await tokenData.token.GetUser();
		if (!(user.roles.has('OWNER') || user.roles.has('ADMIN'))) return next(httpError(404, 'Not found.'));


		res.rs.html.meta.title = 'Stats';
		res.rs.server.aEnabled = false;

		res.rs.html.head = `<link href="/resources/css/bored-stuff.css?v=${res.rs.conf.version}" rel="preload">
			<link href="/resources/css/lib/svgMap.min.css" rel="preload">
			<link href="/resources/css/stats.css" rel="preload">

			<link href="/resources/css/bored-stuff.css?v=${res.rs.conf.version}" rel="stylesheet">
			<link href="/resources/css/lib/svgMap.min.css" rel="stylesheet">
			<link href="/resources/css/stats.css" rel="stylesheet">

			<script defer src="/resources/js/lib/svg-pan-zoom.min.js" nonce="${res.rs.server.nonce}"></script>
			<script defer src="/resources/js/lib/svgMap.min.js" nonce="${res.rs.server.nonce}"></script>
			<script defer src="/resources/js/stats.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>`;

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('stats.ejs'));

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpError(500, e));
	}
});

export = router;
