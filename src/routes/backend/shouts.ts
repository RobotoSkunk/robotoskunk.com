import express from 'express';
import { logger } from '../../globals';
import httpError from 'http-errors';
import { pgConn, LegacyUser, Shout } from '../../libraries/db';
import { RSTime } from 'dotcomcore/dist/RSEngine';
import { __commentLimiter, __httpError, __rateLimiter, __setHeaderAuto } from '../../libraries/rateLimiter';
import { LangCode } from '../../libraries/lang';
import { Blacklist } from '../../libraries/db-utils';

const router = express.Router();

function relativeTime(time: Date, lang: LangCode = 'en'): { time: number, relative: string } {
	return {
		time: time.getTime(),
		relative: RSTime.RelativeAgo(time, lang)
	}
}


router.get('/:user/:page', async (req, res, next) => {
	const client = await pgConn.connect();

	try {
		const tokenData = await res.rs.client.token();
		var uid = '';

		if (tokenData) {
			const user = await tokenData.token.GetUser();
			uid = user.id;
		}

		const page = Number.parseInt(req.params.page);
		if (Number.isNaN(page)) return next(httpError(400, 'Invalid page'));
		if (page < 0) return next(httpError(400, 'Invalid page'));

		const victim = await LegacyUser.GetByHandler(req.params.user);
		const _count = await client.query('SELECT COUNT(1) FROM shouts WHERE victim = $1', [ victim.id ]);

		const maxPage = Math.ceil(_count.rows[0].count / 10);
		if (page > maxPage) return next(httpError(400, 'Invalid page'));

		const shouts = [];

		for await (const shout of Shout.GetByVictim(victim.id, page)) {
			const author = await LegacyUser.GetById(shout.author);
			const editHistory = [];

			for await (const edit of shout.GetEdits()) {
				editHistory.push({
					content: edit.content,
					created_at: relativeTime(edit.createdAt)
				});
			}

			shouts.push({
				id: shout.id,
				author: {
					name: author ? author.name : '[Deleted LegacyUser]',
					handler: author ? author.handler : null
				},
				content: shout.content,
				created_at: relativeTime(shout.createdAt),
				edited_at: shout.editedAt ? relativeTime(shout.editedAt) : null,
				editable: uid === shout.author,
				edit_history: editHistory
			});
		}


		res.status(200).json({
			'page': page,
			'max_page': Math.ceil(_count.rows[0].count / 10),
			'shouts': shouts
		});
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	} finally {
		client.release();
	}
});

router.put('/:user', async (req, res, next) => {
	var cont = req.body.content;
	const client = await pgConn.connect();

	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(401, 'Unauthorized'));

		const csrf = req.body._csrf;
		if (typeof csrf !== 'string') return next(httpError(401, 'Invalid CSRF token'));
		if (!await tokenData.token.ValidateCSRF(csrf)) return next(httpError(401, 'Invalid CSRF token'));
		
		const user = await tokenData.token.GetUser();
		const blacklist = await user.CheckBlacklist();
		if ((blacklist & Blacklist.FLAGS.BANNED) !== 0) return next(httpError(403, 'You are banned'));
		if ((blacklist & Blacklist.FLAGS.SHOUTS) !== 0) {
			const status = await user.CheckSpecificBlacklist(Blacklist.FLAGS.SHOUTS);

			var reason = 'You are banned from shouting';
			if (status.reason) reason += `: ${status.reason}`;

			return res.status(403).json({ 'success': false, 'message': reason });
		}

		const e = await user.GetPrimaryEmail();
		if (!e.verified)
			return res.status(403).json({ 'success': false, 'message': 'You need to verify your email' });

		const victim = await LegacyUser.GetByHandler(req.params.user);

		const response = await Shout.Create(user.id, victim.id, cont, (limiter) => { __setHeaderAuto(res, limiter); });

		switch (response) {
			case Shout.Code.INTERNAL_ERROR: return next(httpError(500, 'Internal error'));
			case Shout.Code.INVALID_LENGTH: return next(httpError(400, 'Invalid content'));
			case Shout.Code.RATE_LIMITED: return next(__httpError);
		}

		res.status(200).json({ 'success': true });
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	} finally {
		client.release();
	}
});

router.delete('/:user/:id', async (req, res, next) => {
	const id = Number.parseInt(req.params.id);
	if (Number.isNaN(id)) return next(httpError(400, 'Invalid shout id'));

	const client = await pgConn.connect();

	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(401, 'Unauthorized'));

		const csrf = req.headers._csrf;
		if (typeof csrf !== 'string') return next(httpError(401, 'Invalid CSRF token'));
		if (!await tokenData.token.ValidateCSRF(csrf)) return next(httpError(401, 'Invalid CSRF token'));


		const user = await tokenData.token.GetUser();
		if ((await user.CheckBlacklist() & Blacklist.FLAGS.BANNED) !== 0) return next(httpError(403, 'You are banned'));
		const victim = await LegacyUser.GetByHandler(req.params.user);

		const shout = await Shout.GetById(id);
		if (!shout) return next(httpError(404, 'Shout not found'));
		if (shout.author !== user.id || shout.victim !== victim.id) return next(httpError(403, 'Unauthorized'));


		await shout.Delete();
		res.status(200).json({ 'success': true });
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	} finally {
		client.release();
	}
});

router.post('/:user/:id', async (req, res, next) => {
	const id = Number.parseInt(req.params.id);
	if (Number.isNaN(id)) return next(httpError(400, 'Invalid shout id'));

	const client = await pgConn.connect();
	var cont = req.body.content;


	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(401, 'Unauthorized'));

		const csrf = req.body._csrf;
		if (typeof csrf !== 'string') return next(httpError(401, 'Invalid CSRF token'));
		if (!await tokenData.token.ValidateCSRF(csrf)) return next(httpError(401, 'Invalid CSRF token'));


		const user = await tokenData.token.GetUser();
		const blacklist = await user.CheckBlacklist();
		if ((blacklist & Blacklist.FLAGS.BANNED) !== 0) return next(httpError(403, 'You are banned'));
		if ((blacklist & Blacklist.FLAGS.SHOUTS) !== 0) {
			const status = await user.CheckSpecificBlacklist(Blacklist.FLAGS.SHOUTS);

			var reason = 'You are banned from shouting';
			if (status.reason) reason += `: ${status.reason}`;

			return res.status(403).json({ 'success': false, 'message': reason });
		}

		const victim = await LegacyUser.GetByHandler(req.params.user);

		const shout = await Shout.GetById(id);
		if (!shout) return next(httpError(404, 'Shout not found'));
		if (shout.author !== user.id || shout.victim !== victim.id) return next(httpError(403, 'Unauthorized'));

		const response = await shout.Update(user.id, cont);

		switch (response) {
			case Shout.Code.INTERNAL_ERROR: return next(httpError(500, 'Internal error'));
			case Shout.Code.INVALID_LENGTH: return next(httpError(400, 'Invalid content'));
			case Shout.Code.MAXIMUM_EDITS: return next(httpError(403, 'Maximum edits reached'));
			case Shout.Code.NOT_ALLOWED: return next(httpError(401, 'Unauthorized'));
		}

		res.status(200).json({ 'success': true });
	} catch (e) {
		logger.error(e);
		next(httpError(500, e));
	} finally {
		client.release();
	}
});


export = router;
