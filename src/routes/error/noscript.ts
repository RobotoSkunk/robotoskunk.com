import express from 'express';
import conf from '../../conf';

const router = express.Router();

router.get('/', async (req, res, next) => {
	res.rs.html.head = `<script nonce="${res.rs.server.nonce}">window.location.href = '/';</script>`;
	res.rs.html.meta = {
		'title': 'Disabled JavaScript',
		'description': 'This site requires JavaScript to be enabled to function properly.',
		'img': `${res.rs.conf.root}/resources/img/meta-icon.webp`
	}

	res.rs.error = {
		'code': 'JavaScript is not enabled',
		'message': 'Please enable JavaScript to view this website.',
		'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
		'imgAlt': 'Alex Skunk dizzy on the floor'
	};

	await res.renderDefault('layout-http-error.ejs', { 'checkBannedUser': false });
});

export = router;
