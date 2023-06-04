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
import { RSTime } from 'dotcomcore/dist/RSEngine';

import ejs from 'ejs';
import path from 'path';
import httpErrors from 'http-errors';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('Terms of service');
		res.rs.html.meta.description = "I know it's tempting to skip the terms of service and just use the website, but it's important to read them first.";
	
		res.rs.html.head = `<link rel="preload" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" as="style">
			<link rel="stylesheet" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}">`;
	
		const date = RSTime.SetTimezone(new Date(2023, RSTime.MONTH_INDEX.JANUARY, 14), -5);
	
	
		res.rs.html.body = await ejs.renderFile(res.getEJSPath('terms.ejs'), { lastUpdate: date.getTime(), nonce: res.rs.server.nonce });
	
		await res.renderDefault('layout.ejs', {
			checkIfUserHasBirthdate: false
		});

	} catch (e) {
		next(httpErrors(500, e));
	}
});

export = router;
