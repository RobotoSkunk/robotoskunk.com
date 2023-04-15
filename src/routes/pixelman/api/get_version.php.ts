import express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => {
	res.send('actual_version|0.2.5.3');
});


export = router;
