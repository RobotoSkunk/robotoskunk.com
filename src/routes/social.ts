import express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => res.redirect('/contact'));

export = router;
