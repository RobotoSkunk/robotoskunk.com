import express from 'express';

import ejs from 'ejs';
import path from 'path';
import httpErrors from 'http-errors';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('Acknowledgements');
		res.rs.html.meta.description = 'Acknowledgements to the amazing open source projects that made this website possible.';
	
		res.rs.html.head = `<link rel="preload" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" as="style">
			<link rel="stylesheet" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}">
			
			<style>h3 { margin-bottom: 0 }</style>`;
	
	
		res.rs.html.body = await ejs.renderFile(res.getEJSPath('acknowledgements.ejs'));
	
		await res.renderDefault('layout.ejs');

	} catch (e) {
		next(httpErrors(500, e));
	}
});

export = router;
