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

const router = express.Router();

router.post('/', async (req, res, next) => {
	if (typeof req.body.ver !== 'string' || typeof req.body.launcher_ver !== 'string') return res.send('no_version');

	const body: { ver: string, launcher_ver: string } = req.body;

	if (body.launcher_ver < '0.2.3.2') return res.send('launcher_update|0.2.3.2|https://robotoskunk.com|');

	if (body.ver < '0.2.5.3') return res.send('update|0.2.5.3');

	res.send('stay|0.2.5.3');
});


export = router;
