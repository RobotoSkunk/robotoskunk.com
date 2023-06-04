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
import httpErrors from 'http-errors';
import { Blacklist } from '../libraries/db-utils';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) res.redirect('/');

		const user = await tokenData.token.GetUser();
		if ((await user.CheckBlacklist() & Blacklist.FLAGS.BANNED) === 0) res.redirect('/');


		res.rs.html.meta.setSubtitle("You can't use this website");
		res.rs.html.meta.description = "You have been banned from using this website. If you think this is a mistake, please contact us.";

		const status = await user.CheckSpecificBlacklist(Blacklist.FLAGS.BANNED);

		var reason = '';

		if (status.reason) reason = `<br><b>Reason</b>: ${status.reason}`;
		if (status.ends_at) reason += `<br>(until <script nonce="${res.rs.server.nonce}">document.write(new Date(${status.ends_at.getTime()}).toLocaleString())</script>)`;


		res.rs.error = {
			code: 'Your account has been banned',
			message: `We have noticed that the activity of your account has violated our terms of service and therefore we can't offer you services anymore.${reason}<br><br><a href="/accounts/logout" class="btn">Log out</a>`,
			imgPath: '/resources/svg/alex-skunk/dizzy.svg',
			imgAlt: 'Dizzy skunk'
		};


		await res.renderDefault('layout-http-error.ejs', { 'checkBannedUser': false });
	} catch (e) {
		next(httpErrors(500, e));
	}
});

export = router;
