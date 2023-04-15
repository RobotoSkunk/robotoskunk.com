import express from 'express';
import httpErrors from 'http-errors';
import ejs from 'ejs';
import { articles, Commission } from '../../data/comms';
import { Commissions, Config, pgConn } from '../../libs/db';


const router = express.Router();

router.get('/', async (req, res, next) => {
	const client = await pgConn.connect();
	res.rs.server.aEnabled = false;


	try {
		var isAdmin = false, local: string[] = [], page = 0;

		const tokenData = await res.rs.client.token();
		if (tokenData) {
			const user = await tokenData.token.GetUser();
			isAdmin = user.roles.has('OWNER');
		}

		if (req.query.page) {
			page = parseInt(req.query.page as string);
			if (isNaN(page)) page = 0;
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

		const comms: {
			id: string;
			label: string;
			status: string;
			createdAt: number;
		}[] = [];

		var maxPage = 0;

		if (tokenData) {
			const data: Commission[] = isAdmin ?
				(await client.query(`SELECT id, _title, created_at FROM commissions ORDER BY created_at DESC LIMIT 10 OFFSET $1;`, [ page * 10 ])).rows :
				(await client.query(`SELECT id, _title, created_at FROM commissions WHERE author = $1 OR id = ANY($2) ORDER BY created_at DESC LIMIT 10 OFFSET $3;`, [ tokenData.token.usrid, local, page * 10 ])).rows;

			const count: number = isAdmin ?
				(await client.query(`SELECT COUNT(1) FROM commissions;`)).rows[0].count :
				(await client.query(`SELECT COUNT(1) FROM commissions WHERE author = $1 OR id = ANY($2);`, [ tokenData.token.usrid, local ])).rows[0].count;

			maxPage = Math.ceil(count / 10);


			for (const row of data) {
				const status = await Commissions.GetStatus(row.id);

				comms.push({
					id: row.id,
					label: row._title,
					status: Commissions.StatusBanner(status, 'negative'),
					createdAt: row.created_at.getTime()
				});
			}
		} else {
			const data: Commission[] = (await client.query(`SELECT id, _title, created_at FROM commissions WHERE id = ANY($1) ORDER BY created_at DESC LIMIT 10 OFFSET $2;`, [ local, page * 10 ])).rows;
			const count: number = (await client.query(`SELECT COUNT(1) FROM commissions WHERE id = ANY($1);`, [ local ])).rows[0].count;

			maxPage = Math.ceil(count / 10);


			for (const row of data) {
				const status = await Commissions.GetStatus(row.id);

				comms.push({
					id: row.id,
					label: row._title,
					status: Commissions.StatusBanner(status, 'negative'),
					createdAt: row.created_at.getTime()
				});
			}
		}



		res.rs.html.body = await ejs.renderFile(res.getEJSPath('commissions/order-list.ejs'), {
			articles,
			commissions: comms,
			nonce: res.rs.server.nonce,
			page,
			maxPage
		});

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpErrors(500, e));
	} finally {
		client.release();
	}
});

export = router;
