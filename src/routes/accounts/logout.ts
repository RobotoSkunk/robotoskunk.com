import { env } from '../../globals';
import httpError from 'http-errors';
import { UserAuditLog } from '../../libraries/db';
import express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => {
	const tokenData = await res.rs.client.token();
	if (!tokenData) res.redirect('/');


	res.rs.html.meta.setSubtitle('Logout');

	res.rs.html.head = `<script defer src="/resources/js/logout.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;


	res.rs.html.body = `<div class="section" data-height="250">
			<h1>Log out</h1>
			<p>Are you sure you want to log out?</p>

			<button class="submit" data-type="logout">Log out</button>
			<button class="submit" data-type="cancel">Cancel</button>
		</div>`;

	await res.renderDefault('layout-api-form.ejs', {
		denyIfLoggedIn: false,
		checkBannedUser: false,
		checkIfUserHasBirthdate: false
	});
});

router.post('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (tokenData) await tokenData.token.Destroy();

		res.clearCookie('auth_token');
		res.redirect('/');

		await UserAuditLog.Add(tokenData.token.usrid, req.useragent?.source, UserAuditLog.Type.LOGIN, UserAuditLog.Relevance.LOW);
	} catch (e) {
		next(httpError(500, e));
	}
});

export = router;
