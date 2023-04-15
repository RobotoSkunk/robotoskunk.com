import express from 'express';
import httpErrors from 'http-errors';
import ejs from 'ejs';


const router = express.Router();

router.get('/', async (req, res, next) => {
	try {

		res.rs.html.head = `<link rel="preload" href="/resources/css/comms.css" as="style">
			<link rel="stylesheet" href="/resources/css/comms.css">`;

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('commissions/rules.ejs'));

		await res.renderDefault('layout.ejs');
	} catch (e) {
		next(httpErrors(500, e));
	}
});

export = router;
