import express from 'express';
import conf from '../../conf';

const router = express.Router();

router.get('/', async (req, res, next) => {
	res.rs.html.meta = {
		'title': 'Unsupported Browser',
		'description': 'Please use a modern browser to view this website.',
		'img': `${res.rs.conf.root}/resources/img/meta-icon.webp`
	}

	res.rs.error = {
		'code': 'Your browser is not supported',
		'message': 'Please use a modern browser to view this website.',
		'imgPath': '/resources/svg/alex-skunk/slow.svg',
		'imgAlt': 'Alex Skunk watching a snail'
	};

	await res.renderDefault('layout-http-error.ejs', { 'checkBannedUser': false });
});

export = router;
