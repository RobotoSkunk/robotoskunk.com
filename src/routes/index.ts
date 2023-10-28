import express from 'express';
import ejs from 'ejs';
import httpError from 'http-errors';

const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		res.rs.html.head = `<link rel="preload" href="/resources/css/common/branding-buttons.css?v=${res.rs.conf.version}" as="style">
			<link rel="preload" href="/resources/css/fonts/paypal.css?v=${res.rs.conf.version}" as="style">

			<link rel="stylesheet" href="/resources/css/common/branding-buttons.css?v=${res.rs.conf.version}">
			<link rel="stylesheet" href="/resources/css/fonts/paypal.css?v=${res.rs.conf.version}">

			<script src="https://storage.ko-fi.com/cdn/widget/Widget_2.js" nonce="${res.rs.server.nonce}"></script>`;

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('index.ejs'), {
			nonce: res.rs.server.nonce
		});

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpError(500, e));
	}
});

export = router;
