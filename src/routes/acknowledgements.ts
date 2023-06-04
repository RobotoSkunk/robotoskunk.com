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
import path from 'path';
import httpErrors from 'http-errors';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('Acknowledgements');
		res.rs.html.meta.description = 'Acknowledgements to the amazing open source projects that made this website possible.';
	
		res.rs.html.head = `<link rel="preload" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" as="style">
			<link rel="stylesheet" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}">
			
			<style>h3 { margin-bottom: 0 }</style>`;
	
	
		res.rs.html.body = await ejs.renderFile(res.getEJSPath('acknowledgements.ejs'));
	
		await res.renderDefault('layout.ejs');

	} catch (e) {
		next(httpErrors(500, e));
	}
});

export = router;
