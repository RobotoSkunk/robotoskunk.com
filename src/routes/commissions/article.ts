import express from 'express';
import httpErrors from 'http-errors';
import ejs from 'ejs';

import { articles, DBData } from '../../data/comms';
import stringify from 'safe-stable-stringify';
import { env, logger } from '../../globals';
import { RSCrypto, RSMath, RSTime } from 'dotcomcore/dist/RSEngine';
import { Commissions, Config, pgConn } from '../../libraries/db';
import { Blacklist } from '../../libraries/db-utils';


const router = express.Router();


router.get('/:article', async (req, res, next) => {
	try {
		const article = articles.find(a => a.id === req.params.article);
		if (!article) return next(httpErrors(404, 'Article not found'));
		
		const count = await Commissions.GetOpen();
		const commsLimit = await Config.Get('commissions-limit');

		if (count.length >= commsLimit) {
			res.rs.html.meta = {
				'title': 'Queue is full!!1 :(',
				'description': 'The queue is full, please try again later.',
				'img': `${res.rs.env.root}/resources/img/meta-icon.webp`
			};

			res.rs.error = {
				'code': 'Queue is full :(',
				'message': 'Sorry, but the queue is full. Please try again later.',
				'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
				'imgAlt': 'Alex Skunk dizzy on the floor'
			};

			return await res.renderDefault('layout-http-error.ejs');
		}

		const tokenData = await res.rs.client.token();
		if (tokenData) {
			const user = await tokenData.token.GetUser();
			const status = await user.CheckSpecificBlacklist(Blacklist.FLAGS.COMMISSIONS);

			if (status) {
				var reason = '';
				if (status.reason) reason = `<br><b>Reason</b>: ${status.reason}`;
				if (status.ends_at) reason += `<br>(until <script nonce="${res.rs.server.nonce}">document.write(new Date(${status.ends_at.getTime()}).toLocaleString())</script>)`;

				res.rs.html.meta = {
					'title': `You can't request commissions`,
					'description': 'You have been banned from requesting commissions. If you think this is a mistake, please contact us.',
					'img': `${res.rs.env.root}/resources/img/meta-icon.webp`
				};

				res.rs.error = {
					'code': `You can't request commissions`,
					'message': `You have been banned from requesting commissions.${reason}`,
					'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
					'imgAlt': 'Alex Skunk dizzy on the floor'
				};

				return await res.renderDefault('layout-http-error.ejs');
			}
		}


		const discount = await Config.Get('commissions-discount');

		res.rs.html.head = `<link rel="preload" href="/resources/css/comms.css" as="style">
			<link rel="stylesheet" href="/resources/css/comms.css">

			<script nonce="${res.rs.server.nonce}">const article = ${stringify(article)}; const discount = ${discount};</script>
			<script defer nonce="${res.rs.server.nonce}" src="/resources/js/article.js"></script>`;

		res.rs.html.body = (await ejs.renderFile(res.getEJSPath('commissions/article.ejs'), {
			name: article.label,
			description: article.description,
			options: article.options,
			price: article.price,
			size: article.size
		})).replace(/(\t|\r\n|\r|\n)/gm, '');

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpErrors(500, e));
	}
});

router.post('/:article', async (req, res, next) => {
	const client = await pgConn.connect();

	try {
		const commsLimit = await Config.Get('commissions-limit');
		const count = await Commissions.GetOpenCount();

		if (count >= commsLimit) return res.status(429).json({
			message: 'The commissions queue is full, please try again later.'
		});

		const tokenData = await res.rs.client.token();

		if (!await Config.Get('commissions-anonymous') && !tokenData) {
			return res.status(401).json({
				message: 'You must be logged in to request a commission.'
			});
		}
		if (tokenData) {
			const user = await tokenData.token.GetUser();
			
			if ((await user.CheckBlacklist() & Blacklist.FLAGS.COMMISSIONS) !== 0)
				return res.status(403).json({ message: 'You have been banned from requesting commissions.' });

			const e = await user.GetPrimaryEmail();
			if (!e.verified)
				return res.status(403).json({ message: 'You must verify your email to request a commission.' });
		}


		// #region Process body
		const article = articles.find(a => a.id === req.params.article);
		if (!article) return next(httpErrors(404, 'Article not found'));

		const body = req.body as {
			canvas: string;
			description: string;
			[key: string]: string;
		}

		const s = body.canvas.split('x');
		var desc = body.description, cx = Number.parseInt(s[0]), cy = Number.parseInt(s[1]);
		if (typeof desc !== 'string' || isNaN(cx) || isNaN(cy)) return next(httpErrors(400, 'Missing fields'));
		desc = desc.trim();

		if (desc.length === 0) return next(httpErrors(400, 'Invalid description'));
		if (desc.length > 1000) return next(httpErrors(400, 'Description too long'));
		// #endregion

		// #region Create and calculate invoice
		const invoice: DBData = {
			version: 2,
			data: [{
				options: [{
					label: 'Commission price',
					value: article.price,
					type: 'price'
				}],
				total: article.price
			}]
		};


		for (const option of article.options) {
			if (!invoice.data[option.group]) invoice.data[option.group] = { options: [], total: 0 };
			const data = invoice.data[option.group];

			if (!body.hasOwnProperty(option.id)) return next(httpErrors(400, 'Missing fields'));


			switch (option.type) {
				case 'radio':
					const opt = option.options.find(o => o.id === req.body[option.id]);
					if (!opt) return next(httpErrors(400, 'Missing fields'));

					data.options.push({
						label: option.label,
						name: opt.label,
						value: opt.value,
						type: 'price'
					});
					data.total += opt.value;
					break;
				case 'number':
					var num = Number.parseInt(req.body[option.id]);
					if (isNaN(num)) return next(httpErrors(400, 'Invalid fields'));
					num *= option.data.value;

					switch (option.data.action) {
						case 'add': data.total += num; break;
						case 'multiply': data.total *= num; break;
					}

					data.options.push({
						label: option.label,
						value: num,
						type: option.data.action
					});
					break;
			}
		}

		if (article.size.custom) {
			cx = RSMath.Clamp(cx, 100, 10000);
			cy = RSMath.Clamp(cy, 100, 10000);
		} else if (!article.size.defaults.some(s => s[0] === cx && s[1] === cy)) {
			cx = article.size.defaults[0][0];
			cy = article.size.defaults[0][1];
		}
		
		const price = invoice.data.reduce((a, b) => a + b.total, 0);
		// #endregion
		

		var uid = tokenData ? tokenData.token.usrid : null;
		const id = RSCrypto.RandomBytes(16);


		// #region Create commission
		await client.query(`INSERT INTO commissions (id, author, _title, _desc, _size, price, discount, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
			id,
			uid,
			article.label,
			desc,
			`(${cx}, ${cy})`,
			price,
			await Config.Get('commissions-discount'),
			stringify(invoice)
		]);
		// #endregion


		if (!tokenData) {
			const cookie = req.cookies['commissions'];
			var local: string[] = [];

			if (cookie) {
				try {
					local = JSON.parse(cookie);

					if (Array.isArray(local)) local.push(id);
				} catch (e) {
					res.clearCookie('commissions');
					local = [ id ];
				}
			} else local = [ id ];

			res.cookie('commissions', stringify(local), {
				maxAge: RSTime._YEAR_ / 1000 * 10,
				httpOnly: true,
				sameSite: 'lax',
				secure: env.production && !res.rs.client.isOnion,
				path: '/',
				domain: res.rs.client.isOnion ? undefined : (env.production ? `.${env.domain}` : 'localhost')
			});
		}

		res.status(200).json({
			message: 'Commission created successfully!', id
		});
	} catch (e) {
		logger.error(e);
		next(httpErrors(500, 'Something went wrong...'));
	} finally {
		client.release();
	}
});

export = router;
