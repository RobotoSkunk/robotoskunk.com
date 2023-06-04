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

import { env } from '../globals';
import { pgConn } from '../libraries/db';

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

		res.rs.html.head = `<link href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" rel="preload">
			<link href="/resources/css/lib/svgMap.min.css" rel="preload">
			<link href="/resources/css/stats.css" rel="preload">

			<link href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" rel="stylesheet">
			<link href="/resources/css/lib/svgMap.min.css" rel="stylesheet">
			<link href="/resources/css/stats.css" rel="stylesheet">

			<script defer src="/resources/js/lib/svg-pan-zoom.min.js" nonce="${res.rs.server.nonce}"></script>
			<script defer src="/resources/js/lib/svgMap.min.js" nonce="${res.rs.server.nonce}"></script>
			<script defer src="/resources/js/stats.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('stats.ejs'));

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpError(500, e));
	}
});

export = router;
