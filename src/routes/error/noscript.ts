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
import env from '../../env';

const router = express.Router();

router.get('/', async (req, res, next) => {
	res.rs.html.head = `<script nonce="${res.rs.server.nonce}">window.location.href = '/';</script>`;
	res.rs.html.meta = {
		'title': 'Disabled JavaScript',
		'description': 'This site requires JavaScript to be enabled to function properly.',
		'img': `${res.rs.env.root}/resources/img/meta-icon.webp`
	}

	res.rs.error = {
		'code': 'JavaScript is not enabled',
		'message': 'Please enable JavaScript to view this website.',
		'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
		'imgAlt': 'Alex Skunk dizzy on the floor'
	};

	await res.renderDefault('layout-http-error.ejs', { 'checkBannedUser': false });
});

export = router;
