import express from 'express';
import { RSTime } from 'dotcomcore/dist/RSEngine';

import ejs from 'ejs';
import path from 'path';
import httpErrors from 'http-errors';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {
		res.rs.html.meta.setSubtitle('Terms of service');
		res.rs.html.meta.description = "I know it's tempting to skip the terms of service and just use the website, but it's important to read them first.";
	
		res.rs.html.head = `<link rel="preload" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" as="style">
			<link rel="stylesheet" href="/resources/css/bored-stuff.css?v=${res.rs.env.version}">`;
	
		const date = RSTime.SetTimezone(new Date(2023, RSTime.MONTH_INDEX.JANUARY, 14), -5);
	
	
		res.rs.html.body = await ejs.renderFile(res.getEJSPath('terms.ejs'), { lastUpdate: date.getTime(), nonce: res.rs.server.nonce });
	
		await res.renderDefault('layout.ejs', {
			checkIfUserHasBirthdate: false
		});

	} catch (e) {
		next(httpErrors(500, e));
	}
});

export = router;
