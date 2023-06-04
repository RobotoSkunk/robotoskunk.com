import express from 'express';
import httpErrors from 'http-errors';
import ejs from 'ejs';
import { articles } from '../../data/comms';
import { Commissions, Config, pgConn } from '../../libraries/db';


const router = express.Router();

router.get('/', async (req, res, next) => {
	const client = await pgConn.connect();

	try {
		var isAdmin = false, local: string[] = [];

		const tokenData = await res.rs.client.token();
		if (tokenData) {
			const user = await tokenData.token.GetUser();
			isAdmin = user.roles.has('OWNER');
		}

		const cookie = req.cookies['commissions'];
		if (cookie) {
			try {
				local = JSON.parse(cookie);

				if (!Array.isArray(local)) throw new Error('Invalid cookie');
			} catch (e) {
				res.clearCookie('commissions');
			}
		}


		res.rs.html.head = `<link rel="preload" href="/resources/css/comms.css" as="style">
			<link rel="stylesheet" href="/resources/css/comms.css">`;

		const open = await Commissions.GetOpen();
		const comms: {
			id: string;
			label: string;
			author: string;
			status: string;
			allow: boolean;
		}[] = [];


		for (const row of open) {
			var author: string = null, isOwner = false;

			if (row.author) {
				const _req = await client.query(`SELECT _handler FROM users WHERE id = $1;`, [ row.author ]);
				author = _req.rows[0]._handler;

				if (tokenData) isOwner = tokenData.token.usrid === row.author;
			} else {
				if (local.includes(row.id)) isOwner = true;
			}

			const status = await Commissions.GetStatus(row.id);


			comms.push({
				id: row.id,
				label: row._title,
				author: author,
				status: Commissions.StatusBanner(status, 'negative'),
				allow: isOwner || isAdmin
			});
		}

		var availableSlots = await Config.Get('commissions-limit') - comms.length;

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('commissions/index.ejs'), {
			articles,
			commissions: comms,
			isAdmin: isAdmin,
			available: availableSlots
		});

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpErrors(500, e));
	} finally {
		client.release();
	}
});

export = router;
