import express from 'express';
import ejs from 'ejs';
import httpError from 'http-errors';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('About');
		res.rs.html.meta.description = 'Meet a few more about the person behind RobotoSkunk.';
	
		res.rs.html.head = `<link rel="preload" href="/resources/css/about.css?v=${res.rs.conf.version}" as="style">
			<link rel="stylesheet" href="/resources/css/about.css?v=${res.rs.conf.version}">
			<script defer src="/resources/js/about.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>`;
	
		res.rs.html.body = await ejs.renderFile(res.getEJSPath('about.ejs'));
	
		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpError(500, e));
	}
});

export = router;
