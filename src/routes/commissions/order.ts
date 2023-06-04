import express from 'express';
import httpErrors from 'http-errors';
import ejs from 'ejs';

import { Commission } from '../../data/comms';
import { env, logger } from '../../globals';
import { Commissions, pgConn, User } from '../../libraries/db';
import * as PayPal from '../../libraries/paypal';


const router = express.Router();


router.get('/:id', async (req, res, next) => {
	try {
		res.rs.server.aEnabled = false;

		const comm: Commission = (await pgConn.query('SELECT * FROM commissions WHERE id = $1', [req.params.id])).rows[0];
		if (!comm) return next(httpErrors(404, 'Commission not found'));

		const tokenData = await res.rs.client.token();

		var email: string = null;
		if (comm.author) {
			if (!tokenData) return next(httpErrors(401, 'You must be logged in to view this page'));
			const user = await tokenData.token.GetUser();

			if (user.id !== comm.author && !user.roles.has('OWNER'))
				return next(httpErrors(403, 'You do not have permission to view this page'));

			if (user.roles.has('OWNER')) {
				const u = await User.GetById(comm.author);

				const e  = await u.GetPrimaryEmail();
				email = await e.Read(await u.GetCryptoKey());
			}
		}


		res.rs.html.head = `<link rel="preload" href="/resources/css/order.css" as="style">
			<link rel="stylesheet" href="/resources/css/order.css">

			<script defer src="/resources/js/order.js" nonce="${res.rs.server.nonce}"></script>`;


		const groups: { label: string, value: string }[][] = [];


		switch (comm.details.version) {
			case 1:
				const group = [];

				for (const row of comm.details.data) group.push(row);
				groups.push(group);
				break;
			case 2:
				for (const group of comm.details.data) {
					const newGroup = [];

					for (const row of group.options) {
						var value = row.value.toString();

						switch (row.type) {
							case 'add': value = `+ ${row.value}`; break;
							case 'multiply': value = `x ${row.value}`; break;
							case 'price': value = `$${row.value} USD`; break;
						}

						newGroup.push({
							label: `<b>${row.label}</b>` + (row.name ? `: ${row.name}` : ''),
							value: value
						});
					}

					newGroup.push({
						label: '',
						value: `$${group.total.toFixed(2)} USD`
					})

					groups.push(newGroup);
				}
				break;
		}

		const status = await Commissions.GetStatus(comm.id);
		var preview: string = comm.preview;

		if (comm.curl && !comm.preview) {
			if (comm.curl.startsWith('https://drive.google.com/file/d/')) {
				const url = new URL(comm.curl);
				const id = url.pathname.split('/')[3];

				// curl = `https://drive.google.com/uc?export=view&id=${id}`;
				preview = `https://drive.google.com/thumbnail?id=${id}`;
			}
		}

		var price = Number.parseFloat(comm.price.replace('$', ''));
		if (comm.discount) price *= 1 - comm.discount;


		res.rs.html.body = await ejs.renderFile(res.getEJSPath('commissions/order.ejs'), {
			nonce: res.rs.server.nonce,
			paypal: env.paypal.id,
			title: comm._title,
			canvas: `${comm._size.x} x ${comm._size.y}`,
			deadline: comm.deadline ? `<script nonce="${res.rs.server.nonce}">document.write(new Date(${comm.deadline.getTime()}).toLocaleDateString());</script>` : '<i>Still negotiating...</i>',
			description: comm._desc,
			invoice: groups,
			price: price.toFixed(2),
			discount: comm.discount.toFixed(2),
			status: Commissions.StatusBanner(status, 'negative'),
			cancelReason: comm.cancel_reason,
			paid: status === Commissions.Status.PAID,
			curl: comm.curl,
			preview: preview,
			id: comm.id,
			email
		});

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpErrors(500, e));
	}
});

router.post('/:id', async (req, res, next) => {
	const client = await pgConn.connect();

	try {
		const comm: Commission = (await pgConn.query('SELECT price, discount FROM commissions WHERE id = $1', [req.params.id])).rows[0];
		if (!comm) return next(httpErrors(404, 'Commission not found'));

		if (!req.body.paypal) return next(httpErrors(400, 'Missing paypal ID'));

		const status = await Commissions.GetStatus(req.params.id);

		if (status === Commissions.Status.PAID) return res.status(400).json({
			success: false,
			message: 'Thank you for your payment, but this commission has already been paid for. The payment has been rejected.'
		});

		if (status !== Commissions.Status.FINISHED) return res.status(400).json({
			success: false,
			message: 'The commission is not finished yet. The payment has been rejected.'
		});

		var price = Number.parseFloat(comm.price.replace('$', ''));
		if (comm.discount) price *= 1 - comm.discount;


		const capture = await PayPal.capturePayment(req.body.paypal);
		if (!capture) return next(httpErrors(400, 'Invalid paypal ID'));

		const amount = capture.purchase_units[0].payments.captures[0].amount;

		if (Number.parseFloat(amount.value) < price) return res.status(400).json({
			success: false,
			message: 'The price of the commission does not match the price of the payment. Please contact RobotoSkunk if you believe this is an error.'
		});

		if (amount.currency_code !== 'USD') return res.status(400).json({
			success: false,
			message: 'The currency of the commission does not match the currency of the payment. Please contact RobotoSkunk if you believe this is an error.'
		});

		await client.query(`UPDATE commissions SET paypal_id = $1, paypal_paid_at = NOW() WHERE id = $2`, [ req.body.paypal, req.params.id ]);

		res.status(200).json({
			success: true,
			message: 'Payment successful!'
		});
	} catch (e) {
		next(httpErrors(500, e));
	} finally {
		client.release();
	}
});

export = router;
