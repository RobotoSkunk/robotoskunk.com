import express from 'express';

const router = express.Router();

router.post('/', async (req, res, next) => {
	if (typeof req.body.ver !== 'string' || typeof req.body.launcher_ver !== 'string') return res.send('no_version');

	const body: { ver: string, launcher_ver: string } = req.body;

	if (body.launcher_ver < '0.2.3.2') return res.send('launcher_update|0.2.3.2|https://robotoskunk.com|');

	if (body.ver < '0.2.5.3') return res.send('update|0.2.5.3');

	res.send('stay|0.2.5.3');
});


export = router;
