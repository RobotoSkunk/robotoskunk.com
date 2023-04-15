import express, { NextFunction, Request, Response, query } from 'express';
import { conf, logger } from '../../globals';
import httpError from 'http-errors';
import { RSMisc, RSRandom, RSTime, RSCrypto } from '../../libs/RSEngine';
import { pgConn, UserAuditLog, User, Email, UserToken } from '../../libs/db';
import stringify from 'safe-stable-stringify';
import ua from 'express-useragent';
import { bruteForceLimiters, __setHeader } from '../../libs/rateLimiter';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { Blacklist } from '../../libs/db-utils';
import ejs from 'ejs';

const router = express.Router();


async function validateRequest(req: Request, res: Response, next: NextFunction) {
	const tokenData = await res.rs.client.token();
	if (!tokenData) return next(httpError(403, 'You are not logged in.'));

	const csrf = req.body._csrf;
	if (typeof csrf !== 'string') return next(httpError(403, 'Invalid CSRF token'));
	if (!await tokenData.token.ValidateCSRF(csrf)) return next(httpError(403, 'Invalid CSRF token'));

	return tokenData;
}

async function validateRequestWithAuthorization(req: Request, res: Response, next: NextFunction): Promise<{ tokenData: UserToken.Response, user: User } | void> {
	const tokenData = await validateRequest(req, res, next);
	if (!tokenData) return;

	const authorization = req.headers.authorization;
	if (!authorization) return next(httpError(400, 'Invalid request.'));

	const user = await tokenData.token.GetUser();
	if ((await user.CheckBlacklist() & Blacklist.FLAGS.BANNED) === Blacklist.FLAGS.BANNED) return next(httpError(403, 'You are banned'));

	if (!await tokenData.token.ValidateConfigAuth(authorization)) {
		const _limiterKey = RSCrypto.HMAC(`${req.ip}:${user.id}`, conf.keys.RATE_LIMITER);

		try { await bruteForceLimiters.wrongTokenInConfig.consume(_limiterKey); } catch (e) {
			var ms: number;
			var msg = 'Please try again later.';
			if (!(e instanceof Error)) ms = (e as RateLimiterRes).msBeforeNext;
			
			if (ms) {
				__setHeader(res, ms);
				msg = `Please try again in ${RSTime.ToString(ms)}.`;
			}

			await UserAuditLog.Add(
				user.id,
				req.useragent?.source,
				UserAuditLog.Type.FAILED_SECURITY_ACCESS,
				UserAuditLog.Relevance.HIGH
			);

			res.status(429).json({ message: msg });
			return;
		}

		return next(httpError(403, 'Invalid authorization.'));
	}


	return { 
		tokenData: tokenData,
		user: user
	};
}
async function validateRequestWithPassword(req: Request, res: Response, next: NextFunction): Promise<{ tokenData: UserToken.Response, user: User } | void> {
	const tokenData = await validateRequest(req, res, next);
	if (!tokenData) return;

	const password = req.body.password;
	if (typeof password !== 'string') return next(httpError(400, 'Invalid request.'));

	const user = await tokenData.token.GetUser();
	if ((await user.CheckBlacklist() & Blacklist.FLAGS.BANNED) === Blacklist.FLAGS.BANNED) return next(httpError(403, 'You are banned'));
	const _limiterKey = RSCrypto.HMAC(`${req.ip}:${user.id}`, conf.keys.RATE_LIMITER);

	try {
		const r = await bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);

		if (r !== null) {
			if (r.consumedPoints > bruteForceLimiters.failedAttemptsAndIP.points) {
				__setHeader(res, r.msBeforeNext);

				res.status(429).json({
					message: `Please try again in ${RSTime.ToString(r.msBeforeNext)}.`
				});
				return;
			}
		}
	} catch (_) { }

	if (!await user.VerifyPassword(req.body.password)) {
		try { await bruteForceLimiters.failedAttemptsAndIP.consume(_limiterKey); } catch (e) {
			var ms: number;
			var msg = 'Please try again later.';
			if (!(e instanceof Error)) ms = (e as RateLimiterRes).msBeforeNext;
			
			if (ms) {
				__setHeader(res, ms);
				msg = `Please try again in ${RSTime.ToString(ms)}.`;
			}

			await UserAuditLog.Add(
				user.id,
				req.useragent?.source,
				UserAuditLog.Type.FAILED_SECURITY_ACCESS,
				UserAuditLog.Relevance.HIGH
			);

			res.status(429).json({ message: msg });
			return;
		}

		res.status(403).json({ message: 'Wrong password.' });
		return;
	}


	await bruteForceLimiters.failedAttemptsAndIP.delete(_limiterKey);
	return { 
		tokenData: tokenData,
		user: user
	};
}


class UserTokenExclusive extends UserToken {
	usedAgo: string;
	isCurrent: boolean;
	userAgent: ua.Details;
	device: string;
}

router.get('/', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(403, 'You are not logged in.'));
		res.rs.server.aEnabled = false;

		const user = await tokenData.token.GetUser();
		if (!user.birthdate) return res.redirect('/');
		await user.LoadFullData();

		const sessions: UserTokenExclusive[] = [];


		for await (const session of tokenData.token.GetAllByUser()) {
			const userAgent = ua.parse(session.client);
			(session as UserTokenExclusive).userAgent = userAgent;
			(session as UserTokenExclusive).device = userAgent.isTablet ? 'tablet' : (userAgent.isMobile ? 'mobile' : 'desktop');
			(session as UserTokenExclusive).isCurrent = session.id === tokenData.token.id;

			sessions.push(session as UserTokenExclusive);
		}

		res.rs.html.meta.setSubtitle('Settings');
		res.rs.html.head = `<link rel="preload" href="/resources/css/settings.css?v=${conf.version}" as="style">
			<link rel="preload" href="/resources/css/common/loader.css?v=${res.rs.conf.version}" as="style">

			<link rel="stylesheet" href="/resources/css/settings.css?v=${conf.version}">
			<link rel="stylesheet" href="/resources/css/common/loader.css?v=${res.rs.conf.version}">
			
			<script defer src="/resources/js/settings.js?v=${conf.version}" nonce="${res.rs.server.nonce}"></script>`;

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/settings.ejs'), {
			csrf: await tokenData.token.GenerateCSRF(),
			nonce: res.rs.server.nonce,
			sessions,
			user
		}, { async: true });

		await res.renderDefault('layout.ejs');
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error.'));
	}
});

router.get('/birthdate', async (req, res, next) => {
	try {
		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(403, 'You are not logged in.'));
		res.rs.server.aEnabled = false;

		const user = await tokenData.token.GetUser();
		if (user.birthdate) return res.redirect('/');


		res.rs.html.meta.setSubtitle('We need to top up your account');

		res.rs.html.head = `<script defer src="/resources/js/birthdate.js?v=${conf.version}" nonce="${res.rs.server.nonce}"></script>`;

		const today = new Date();

		const max = new Date();
		const min = new Date();
		min.setFullYear(today.getFullYear() - 130);
		max.setFullYear(today.getFullYear() - 13);

		const csrf = await tokenData.token.GenerateCSRF();

		res.rs.html.body = await ejs.renderFile(res.getEJSPath('accounts/settings-birthdate.ejs'), {
			min: min.toISOString().split('T')[0],
			max: max.toISOString().split('T')[0],
			csrf
		});


		await res.renderDefault('layout-api-form.ejs', {
			checkIfUserHasBirthdate: false
		});
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error.'));
	}
});

router.post('/birthdate', async (req, res, next) => {
	try {
		if (typeof req.body.csrf !== 'string') return next(httpError(400, 'Invalid CSRF token.'));

		const tokenData = await res.rs.client.token();
		if (!tokenData) return next(httpError(403, 'You are not logged in.'));
		if (!await tokenData.token.ValidateCSRF(req.body.csrf)) return next(httpError(403, 'Invalid CSRF token.'));

		const user = await tokenData.token.GetUser();
		if (user.birthdate) return next(httpError(403, 'You already have a birthdate.'));

		if (typeof req.body.birthdate !== 'string') return res.status(400).json({ 'code': 0, 'message': 'Invalid birthdate.' });

		const birthdate = parseInt(req.body.birthdate);
		if (isNaN(birthdate)) return res.status(400).json({ 'code': 0, 'message': 'Invalid birthdate.' });


		const bday = new Date(birthdate);

		if (!bday) {
			res.status(400).json({
				'code': 0,
				'message': 'Invalid birthdate.'
			});
			return;
		}

		bday.setHours(12, 0, 0, 0);
		if (!RSTime.MinimumAge(bday)) {
			return res.status(403).json({
				'code': 0,
				'message': 'You must be at least 13 years old.'
			});
		}
		if (bday.getTime() < Date.now() - RSTime._YEAR_ * 130) {
			return res.status(403).json({
				'code': 0,
				'message': 'Really funny, but you are not that old.'
			});
		}

		const conn = await pgConn.connect();

		try {
			await conn.query('UPDATE users SET birthdate = $1 WHERE id = $2', [ bday, user.id ]);
		} finally {
			conn.release();
		}

		res.status(200).json({ 'code': 1, 'message': 'OK' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal server error.'));
	}
});



router.post('/profile', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const tokenData = await validateRequest(req, res, next);
		if (!tokenData) return;


		if (typeof req.body.username !== 'string' || typeof req.body.handler !== 'string' || typeof req.body.bio !== 'string')
			return next(httpError(400, 'Invalid request.'));

		const username: string = req.body.username.trim();
		const handler: string = req.body.handler.trim();
		var bio: string = req.body.bio.trim();

		if (username.length < 3 || username.length > 60)
			return res.status(400).json({ 'message': 'Username must be between 3 and 60 characters long.' });

		if (handler.length < 3 || handler.length > 16)
			return res.status(400).json({ 'message': 'Handler must be between 3 and 16 characters long.' });

		if (bio.length > 256)
			return res.status(400).json({ 'message': 'Biography must be less than 256 characters long.' });


		const uid = tokenData.token.usrid;

		const anotherUser = await User.GetByHandler(req.body.handler);
		if (anotherUser && anotherUser.id !== uid) return res.status(400).json({ 'message': 'Handler is already taken.' });

		if (bio.length === 0) req.body.bio = null;
		await conn.query(`UPDATE users SET username = $1, _handler = $2, bio = $3 WHERE id = $4`, [username, handler, bio, uid]);
		res.status(200).json({ 'message': 'User data updated successfully.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});



router.post('/security', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithPassword(req, res, next);
		if (!__res) return;

		const user = __res.user;
		const tokenData = __res.tokenData;

		const emails = [], auditLog = [];

		for await (const email of user.GetEmails()) {
			emails.push({
				'id': email.id,
				'email': await email.Read(await user.GetCryptoKey()),
				'type': email.type,
				'verified': email.verified,
				'createdAt': email.createdAt.getTime()
			});
		}

		for await (const entry of UserAuditLog.FetchPage(user.id, 0)) {
			auditLog.push({
				'action': RSMisc.EnumKey(UserAuditLog.Type, entry.type),
				'relevance': RSMisc.EnumKey(UserAuditLog.Relevance, entry.relevance),
				'createdAt': entry.createdAt.getTime()
			});
		}

		const enabled2fa = await user.Enabled2FA();

		res.status(200).json({
			'authorization': await tokenData.token.GenerateConfigAuth(),
			'emails': emails,
			'audit_log': auditLog,
			'_2fa': enabled2fa,
			'_2fa_recovery_codes': enabled2fa ? await user.GetRecoveryCodesCount() : null
		});
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});
router.post('/security/2fa/enable', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithAuthorization(req, res, next);
		if (!__res) return;

		const user = __res.user;
		const code: string = req.body.code;

		const enabled = await user.Enabled2FA();
		if (enabled) return res.status(400).json({ 'message': '2FA is already enabled.' });


		if (code) {
			if (typeof code !== 'string') next(httpError(400, 'Invalid request.'));
			if (isNaN(parseInt(code))) res.status(400).json({ 'message': 'The code must be a number.' });

			const verified = await user.Verify2FA(code);
			if (!verified) return res.status(403).json({ 'message': 'Wrong code.' });

			await user.Enable2FA();
			const codes = await user.GenerateRecoveryCodes();

			return res.status(200).json({
				'message': '2FA enabled successfully.',
				'codes': codes
			});
		}

		await user.Set2FA();
		const totp = await user.GetTOTPSecret();

		res.status(200).json({
			'qr': await totp.getQR()
		});
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});
router.post('/security/2fa/disable', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithAuthorization(req, res, next);
		if (!__res) return;

		const user = __res.user;

		const enabled = await user.Enabled2FA();
		if (!enabled) return res.status(400).json({ 'message': '2FA is already disabled.' });

		await user.Disable2FA();
		res.status(200).json({ 'message': '2FA disabled successfully.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});


// router.post('/audit', async (req, res, next) => {
// 	const conn = await pgConn.connect();

// 	try {
// 		const __res = await validateRequestWithAuthorization(req, res, next);
// 		if (!__res) return;

// 		const tokenData = __res.tokenData;
// 		const user = __res.user;


// 		res.status(200).json({ 'message': 'OK' });
// 	} catch (e) {
// 		logger.error(e);
// 	} finally {
// 		conn.release();
// 	}
// });
// router.post('/audit/log', async (req, res, next) => {
// 	const conn = await pgConn.connect();

// 	try {
// 		const __res = await validateRequestWithAuthorization(req, res, next);
// 		if (!__res) return;

// 		const tokenData = __res.tokenData;
// 		const user = __res.user;


// 		res.setHeader('Content-Type', 'text/csv');
// 		res.setHeader('Content-Disposition', `attachment; filename="Audit Log - ${user.handler}.csv"`);

// 		res.write('Date,Relevance,Action,UserAgent,Extras\n');
		
// 		for await (const log of UserAuditLog.Fetch(tokenData.token.usrid)) {
// 			const data = [
// 				log.createdAt.toISOString(),
// 				RSMisc.EnumKey(UserAuditLog.Relevance, log.relevance),
// 				RSMisc.EnumKey(UserAuditLog.Type, log.type),
// 				`"${log.userAgent}"`,
// 				`"${stringify(log.data).replace(/"/g, '""')}"`
// 			];

// 			res.write(data.join(',') + '\n');
// 		}

// 		res.end();
// 	} catch (e) {
// 		logger.error(e);
// 	} finally {
// 		conn.release();
// 	}
// });


router.put('/email', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithAuthorization(req, res, next);
		if (!__res) return;

		const user = __res.user;


		const email = req.body.email;
		if (typeof email !== 'string') return next(httpError(400, 'Invalid request.'));

		const emailCount = await user.GetEmailsCount();
		if (emailCount >= 5) return res.status(403).json({ 'message': 'You can\'t add more than 5 emails.' });
		if (!await Email.Validate(email)) return res.status(403).json({ 'message': 'Please use a valid email.' });


		const emailObj = await Email.Get(email);
		const cryptoKey = await user.GetCryptoKey();

		await RSRandom.Wait(50, 100);

		if (!emailObj) {
			const _tmp = await Email.Set(email, cryptoKey, user.id, Email.Type.SECONDARY);
			if (!_tmp) return res.status(400).json({ 'message': 'Invalid email.' });

		} else {
			if (emailObj.userId === user.id) return res.status(403).json({ 'message': 'This email is already registered to your account.' });

			const _tmp = await Email.SetFake(email, cryptoKey, user.id, Email.Type.SECONDARY);
			if (!_tmp) return res.status(403).json({ 'message': 'Invalid email.' });
		}
		UserAuditLog.Add(user.id, req.useragent?.source, UserAuditLog.Type.EMAIL_ADD, UserAuditLog.Relevance.LOW);

		res.status(200).json({ 'message': 'Email added successfully.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});
router.post('/email/set', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithAuthorization(req, res, next);
		if (!__res) return;

		const user = __res.user;

		// #region Check input data
		const primary = req.body.primary, contact = req.body.contact;
		if (typeof primary !== 'string' || typeof contact !== 'string') return next(httpError(400, 'Invalid request.'));
		if (primary === contact) return res.status(400).json({ 'message': 'Primary and contact emails can\'t be the same.' });
		// #endregion

		await RSRandom.Wait(50, 100);

		// #region Check if emails are valid
		const primaryEmail = await Email.GetById(primary);
		if (!primaryEmail) return res.status(400).json({ 'message': 'Invalid primary email.' });
		if (primaryEmail.userId !== user.id) return res.status(403).json({ 'message': 'Invalid primary email.' });
		if (!primaryEmail.verified) return res.status(403).json({ 'message': 'Primary email is not verified.' });

		const contactEmail = contact === 'none' ? null : await Email.GetById(contact);

		if (contact !== 'none') {
			if (!contactEmail) return res.status(400).json({ 'message': 'Invalid contact email.' });	
			if (contactEmail.userId !== user.id) return res.status(403).json({ 'message': 'Invalid contact email.' });
			if (!contactEmail.verified) return res.status(403).json({ 'message': 'Contact email is not verified.' });
		}
		// #endregion


		const _prim = await user.GetPrimaryEmail();
		const _cont = await user.GetContactEmail();

		if (_prim.id !== primaryEmail.id) {
			await user.SetPrimaryEmail(primaryEmail.id);

			UserAuditLog.Add(user.id, req.useragent?.source, UserAuditLog.Type.MAIN_EMAIL_CHANGE, UserAuditLog.Relevance.MEDIUM);
		}

		if (_cont && contactEmail) {
			if (_cont.id !== contactEmail.id) await user.SetContactEmail(contactEmail.id);

		} else if (_cont && !contactEmail) await user.UnsetContactEmail();
		else if (!_cont && contactEmail) await user.SetContactEmail(contactEmail.id);


		res.status(200).json({ 'message': 'Email settings updated successfully.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});
router.post('/email/send-verification', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithAuthorization(req, res, next);
		if (!__res) return;

		const user = __res.user;

		const email = req.body.email;
		if (typeof email !== 'string') return next(httpError(400, 'Invalid request.'));

		const emailObj = await Email.GetById(email);
		if (!emailObj) return res.status(400).json({ 'message': 'Invalid email.' });
		if (emailObj.userId !== user.id) return res.status(400).json({ 'message': 'Invalid email.' });
		if (emailObj.verified) return res.status(400).json({ 'message': 'Email already verified.' });

		await RSRandom.Wait(50, 100);
		await emailObj.Send(Email.MailType.VERIFY);

		res.status(200).json({
			'message': 'If that email exists and is not being used by another account, you will receive a verification email shortly.'
		});
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});
router.post('/email/delete', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const __res = await validateRequestWithAuthorization(req, res, next);
		if (!__res) return;

		const user = __res.user;

		const email = req.body.email;
		if (typeof email !== 'string') return next(httpError(400, 'Invalid request.'));

		const emailObj = await Email.GetById(email);
		if (!emailObj) return res.status(400).json({ 'message': 'Invalid email.' });
		if (emailObj.userId !== user.id) return res.status(400).json({ 'message': 'Invalid email.' });
		if (emailObj.type === Email.Type.PRIMARY) return res.status(400).json({ 'message': 'You can\'t remove your primary email.' });

		await RSRandom.Wait(50, 100);
		await emailObj.Delete();
		UserAuditLog.Add(user.id, req.useragent?.source, UserAuditLog.Type.EMAIL_REMOVE, UserAuditLog.Relevance.MEDIUM);

		res.status(200).json({ 'message': 'Email deleted successfully.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});


router.post('/session/delete', async (req, res, next) => {
	const conn = await pgConn.connect();

	try {
		const tokenData = await validateRequest(req, res, next);
		if (!tokenData) return;

		const user = await tokenData.token.GetUser();

		const session = req.body.session;
		if (typeof session !== 'string') return next(httpError(400, 'Invalid request.'));
		if (session === tokenData.token.id) return res.status(400).json({ 'message': 'You can\'t delete your current session.' });

		const sessionObj = await UserToken.Get(session);
		if (!sessionObj) return res.status(400).json({ 'message': 'Invalid session.' });
		if (sessionObj.usrid !== user.id) return res.status(400).json({ 'message': 'Invalid session.' });

		await sessionObj.Destroy();
		UserAuditLog.Add(user.id, req.useragent?.source, UserAuditLog.Type.LOGOUT, UserAuditLog.Relevance.LOW);

		res.status(200).json({ 'message': 'Session closed successfully.' });
	} catch (e) {
		logger.error(e);
		next(httpError(500, 'Internal error.'));
	} finally {
		conn.release();
	}
});


export = router;
