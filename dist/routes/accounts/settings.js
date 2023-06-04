"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const globals_1 = require("../../globals");
const http_errors_1 = __importDefault(require("http-errors"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const db_1 = require("../../libraries/db");
const express_useragent_1 = __importDefault(require("express-useragent"));
const rateLimiter_1 = require("../../libraries/rateLimiter");
const db_utils_1 = require("../../libraries/db-utils");
const ejs_1 = __importDefault(require("ejs"));
const router = express_1.default.Router();
function validateRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(403, 'You are not logged in.'));
        const csrf = req.body._csrf;
        if (typeof csrf !== 'string')
            return next((0, http_errors_1.default)(403, 'Invalid CSRF token'));
        if (!(yield tokenData.token.ValidateCSRF(csrf)))
            return next((0, http_errors_1.default)(403, 'Invalid CSRF token'));
        return tokenData;
    });
}
function validateRequestWithAuthorization(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const tokenData = yield validateRequest(req, res, next);
        if (!tokenData)
            return;
        const authorization = req.headers.authorization;
        if (!authorization)
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        const user = yield tokenData.token.GetUser();
        if (((yield user.CheckBlacklist()) & db_utils_1.Blacklist.FLAGS.BANNED) === db_utils_1.Blacklist.FLAGS.BANNED)
            return next((0, http_errors_1.default)(403, 'You are banned'));
        if (!(yield tokenData.token.ValidateConfigAuth(authorization))) {
            const _limiterKey = RSEngine_1.RSCrypto.HMAC(`${req.ip}:${user.id}`, globals_1.env.keys.RATE_LIMITER);
            try {
                yield rateLimiter_1.bruteForceLimiters.wrongTokenInConfig.consume(_limiterKey);
            }
            catch (e) {
                var ms;
                var msg = 'Please try again later.';
                if (!(e instanceof Error))
                    ms = e.msBeforeNext;
                if (ms) {
                    (0, rateLimiter_1.__setHeader)(res, ms);
                    msg = `Please try again in ${RSEngine_1.RSTime.ToString(ms)}.`;
                }
                yield db_1.UserAuditLog.Add(user.id, (_a = req.useragent) === null || _a === void 0 ? void 0 : _a.source, db_1.UserAuditLog.Type.FAILED_SECURITY_ACCESS, db_1.UserAuditLog.Relevance.HIGH);
                res.status(429).json({ message: msg });
                return;
            }
            return next((0, http_errors_1.default)(403, 'Invalid authorization.'));
        }
        return {
            tokenData: tokenData,
            user: user
        };
    });
}
function validateRequestWithPassword(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const tokenData = yield validateRequest(req, res, next);
        if (!tokenData)
            return;
        const password = req.body.password;
        if (typeof password !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        const user = yield tokenData.token.GetUser();
        if (((yield user.CheckBlacklist()) & db_utils_1.Blacklist.FLAGS.BANNED) === db_utils_1.Blacklist.FLAGS.BANNED)
            return next((0, http_errors_1.default)(403, 'You are banned'));
        const _limiterKey = RSEngine_1.RSCrypto.HMAC(`${req.ip}:${user.id}`, globals_1.env.keys.RATE_LIMITER);
        try {
            const r = yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);
            if (r !== null) {
                if (r.consumedPoints > rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.points) {
                    (0, rateLimiter_1.__setHeader)(res, r.msBeforeNext);
                    res.status(429).json({
                        message: `Please try again in ${RSEngine_1.RSTime.ToString(r.msBeforeNext)}.`
                    });
                    return;
                }
            }
        }
        catch (_) { }
        if (!(yield user.VerifyPassword(req.body.password))) {
            try {
                yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.consume(_limiterKey);
            }
            catch (e) {
                var ms;
                var msg = 'Please try again later.';
                if (!(e instanceof Error))
                    ms = e.msBeforeNext;
                if (ms) {
                    (0, rateLimiter_1.__setHeader)(res, ms);
                    msg = `Please try again in ${RSEngine_1.RSTime.ToString(ms)}.`;
                }
                yield db_1.UserAuditLog.Add(user.id, (_a = req.useragent) === null || _a === void 0 ? void 0 : _a.source, db_1.UserAuditLog.Type.FAILED_SECURITY_ACCESS, db_1.UserAuditLog.Relevance.HIGH);
                res.status(429).json({ message: msg });
                return;
            }
            res.status(403).json({ message: 'Wrong password.' });
            return;
        }
        yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.delete(_limiterKey);
        return {
            tokenData: tokenData,
            user: user
        };
    });
}
class UserTokenExclusive extends db_1.UserToken {
}
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(403, 'You are not logged in.'));
        res.rs.server.aEnabled = false;
        const user = yield tokenData.token.GetUser();
        if (!user.birthdate)
            return res.redirect('/');
        yield user.LoadFullData();
        const sessions = [];
        try {
            for (var _d = true, _e = __asyncValues(tokenData.token.GetAllByUser()), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                _c = _f.value;
                _d = false;
                try {
                    const session = _c;
                    const userAgent = express_useragent_1.default.parse(session.client);
                    session.userAgent = userAgent;
                    session.device = userAgent.isTablet ? 'tablet' : (userAgent.isMobile ? 'mobile' : 'desktop');
                    session.isCurrent = session.id === tokenData.token.id;
                    sessions.push(session);
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.rs.html.meta.setSubtitle('Settings');
        res.rs.html.head = `<link rel="preload" href="/resources/css/settings.css?v=${globals_1.env.version}" as="style">
			<link rel="preload" href="/resources/css/common/loader.css?v=${res.rs.env.version}" as="style">

			<link rel="stylesheet" href="/resources/css/settings.css?v=${globals_1.env.version}">
			<link rel="stylesheet" href="/resources/css/common/loader.css?v=${res.rs.env.version}">
			
			<script defer src="/resources/js/settings.js?v=${globals_1.env.version}" nonce="${res.rs.server.nonce}"></script>`;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('accounts/settings.ejs'), {
            csrf: yield tokenData.token.GenerateCSRF(),
            nonce: res.rs.server.nonce,
            sessions,
            user
        }, { async: true });
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error.'));
    }
}));
router.get('/birthdate', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(403, 'You are not logged in.'));
        res.rs.server.aEnabled = false;
        const user = yield tokenData.token.GetUser();
        if (user.birthdate)
            return res.redirect('/');
        res.rs.html.meta.setSubtitle('We need to top up your account');
        res.rs.html.head = `<script defer src="/resources/js/birthdate.js?v=${globals_1.env.version}" nonce="${res.rs.server.nonce}"></script>`;
        const today = new Date();
        const max = new Date();
        const min = new Date();
        min.setFullYear(today.getFullYear() - 130);
        max.setFullYear(today.getFullYear() - 13);
        const csrf = yield tokenData.token.GenerateCSRF();
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('accounts/settings-birthdate.ejs'), {
            min: min.toISOString().split('T')[0],
            max: max.toISOString().split('T')[0],
            csrf
        });
        yield res.renderDefault('layout-api-form.ejs', {
            checkIfUserHasBirthdate: false
        });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error.'));
    }
}));
router.post('/birthdate', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (typeof req.body.csrf !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid CSRF token.'));
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(403, 'You are not logged in.'));
        if (!(yield tokenData.token.ValidateCSRF(req.body.csrf)))
            return next((0, http_errors_1.default)(403, 'Invalid CSRF token.'));
        const user = yield tokenData.token.GetUser();
        if (user.birthdate)
            return next((0, http_errors_1.default)(403, 'You already have a birthdate.'));
        if (typeof req.body.birthdate !== 'string')
            return res.status(400).json({ 'code': 0, 'message': 'Invalid birthdate.' });
        const birthdate = parseInt(req.body.birthdate);
        if (isNaN(birthdate))
            return res.status(400).json({ 'code': 0, 'message': 'Invalid birthdate.' });
        const bday = new Date(birthdate);
        if (!bday) {
            res.status(400).json({
                'code': 0,
                'message': 'Invalid birthdate.'
            });
            return;
        }
        bday.setHours(12, 0, 0, 0);
        if (!RSEngine_1.RSTime.MinimumAge(bday)) {
            return res.status(403).json({
                'code': 0,
                'message': 'You must be at least 13 years old.'
            });
        }
        if (bday.getTime() < Date.now() - RSEngine_1.RSTime._YEAR_ * 130) {
            return res.status(403).json({
                'code': 0,
                'message': 'Really funny, but you are not that old.'
            });
        }
        const conn = yield db_1.pgConn.connect();
        try {
            yield conn.query('UPDATE users SET birthdate = $1 WHERE id = $2', [bday, user.id]);
        }
        finally {
            conn.release();
        }
        res.status(200).json({ 'code': 1, 'message': 'OK' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error.'));
    }
}));
router.post('/profile', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield db_1.pgConn.connect();
    try {
        const tokenData = yield validateRequest(req, res, next);
        if (!tokenData)
            return;
        if (typeof req.body.username !== 'string' || typeof req.body.handler !== 'string' || typeof req.body.bio !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        const username = req.body.username.trim();
        const handler = req.body.handler.trim();
        var bio = req.body.bio.trim();
        if (username.length < 3 || username.length > 60)
            return res.status(400).json({ 'message': 'Username must be between 3 and 60 characters long.' });
        if (handler.length < 3 || handler.length > 16)
            return res.status(400).json({ 'message': 'Handler must be between 3 and 16 characters long.' });
        if (bio.length > 256)
            return res.status(400).json({ 'message': 'Biography must be less than 256 characters long.' });
        const uid = tokenData.token.usrid;
        const anotherUser = yield db_1.LegacyUser.GetByHandler(req.body.handler);
        if (anotherUser && anotherUser.id !== uid)
            return res.status(400).json({ 'message': 'Handler is already taken.' });
        if (bio.length === 0)
            req.body.bio = null;
        yield conn.query(`UPDATE users SET username = $1, _handler = $2, bio = $3 WHERE id = $4`, [username, handler, bio, uid]);
        res.status(200).json({ 'message': 'LegacyUser data updated successfully.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/security', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, e_2, _h, _j, _k, e_3, _l, _m;
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithPassword(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        const tokenData = __res.tokenData;
        const emails = [], auditLog = [];
        try {
            for (var _o = true, _p = __asyncValues(user.GetEmails()), _q; _q = yield _p.next(), _g = _q.done, !_g;) {
                _j = _q.value;
                _o = false;
                try {
                    const email = _j;
                    emails.push({
                        'id': email.id,
                        'email': yield email.Read(yield user.GetCryptoKey()),
                        'type': email.type,
                        'verified': email.verified,
                        'createdAt': email.createdAt.getTime()
                    });
                }
                finally {
                    _o = true;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_o && !_g && (_h = _p.return)) yield _h.call(_p);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            for (var _r = true, _s = __asyncValues(db_1.UserAuditLog.FetchPage(user.id, 0)), _t; _t = yield _s.next(), _k = _t.done, !_k;) {
                _m = _t.value;
                _r = false;
                try {
                    const entry = _m;
                    auditLog.push({
                        'action': RSEngine_1.RSUtils.EnumKey(db_1.UserAuditLog.Type, entry.type),
                        'relevance': RSEngine_1.RSUtils.EnumKey(db_1.UserAuditLog.Relevance, entry.relevance),
                        'createdAt': entry.createdAt.getTime()
                    });
                }
                finally {
                    _r = true;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (!_r && !_k && (_l = _s.return)) yield _l.call(_s);
            }
            finally { if (e_3) throw e_3.error; }
        }
        const enabled2fa = yield user.Enabled2FA();
        res.status(200).json({
            'authorization': yield tokenData.token.GenerateConfigAuth(),
            'emails': emails,
            'audit_log': auditLog,
            '_2fa': enabled2fa,
            '_2fa_recovery_codes': enabled2fa ? yield user.GetRecoveryCodesCount() : null
        });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/security/2fa/enable', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithAuthorization(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        const code = req.body.code;
        const enabled = yield user.Enabled2FA();
        if (enabled)
            return res.status(400).json({ 'message': '2FA is already enabled.' });
        if (code) {
            if (typeof code !== 'string')
                next((0, http_errors_1.default)(400, 'Invalid request.'));
            if (isNaN(parseInt(code)))
                res.status(400).json({ 'message': 'The code must be a number.' });
            const verified = yield user.Verify2FA(code);
            if (!verified)
                return res.status(403).json({ 'message': 'Wrong code.' });
            yield user.Enable2FA();
            const codes = yield user.GenerateRecoveryCodes();
            return res.status(200).json({
                'message': '2FA enabled successfully.',
                'codes': codes
            });
        }
        yield user.Set2FA();
        const totp = yield user.GetTOTPSecret();
        res.status(200).json({
            'qr': yield totp.getQR()
        });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/security/2fa/disable', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithAuthorization(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        const enabled = yield user.Enabled2FA();
        if (!enabled)
            return res.status(400).json({ 'message': '2FA is already disabled.' });
        yield user.Disable2FA();
        res.status(200).json({ 'message': '2FA disabled successfully.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
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
// 				RSUtils.EnumKey(UserAuditLog.Relevance, log.relevance),
// 				RSUtils.EnumKey(UserAuditLog.Type, log.type),
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
router.put('/email', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _u;
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithAuthorization(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        const email = req.body.email;
        if (typeof email !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        const emailCount = yield user.GetEmailsCount();
        if (emailCount >= 5)
            return res.status(403).json({ 'message': 'You can\'t add more than 5 emails.' });
        if (!(yield db_1.LegacyEmail.Validate(email)))
            return res.status(403).json({ 'message': 'Please use a valid email.' });
        const emailObj = yield db_1.LegacyEmail.Get(email);
        const cryptoKey = yield user.GetCryptoKey();
        yield RSEngine_1.RSRandom.Wait(50, 100);
        if (!emailObj) {
            const _tmp = yield db_1.LegacyEmail.Set(email, cryptoKey, user.id, db_1.LegacyEmail.Type.SECONDARY);
            if (!_tmp)
                return res.status(400).json({ 'message': 'Invalid email.' });
        }
        else {
            if (emailObj.userId === user.id)
                return res.status(403).json({ 'message': 'This email is already registered to your account.' });
            const _tmp = yield db_1.LegacyEmail.SetFake(email, cryptoKey, user.id, db_1.LegacyEmail.Type.SECONDARY);
            if (!_tmp)
                return res.status(403).json({ 'message': 'Invalid email.' });
        }
        db_1.UserAuditLog.Add(user.id, (_u = req.useragent) === null || _u === void 0 ? void 0 : _u.source, db_1.UserAuditLog.Type.EMAIL_ADD, db_1.UserAuditLog.Relevance.LOW);
        res.status(200).json({ 'message': 'LegacyEmail added successfully.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/email/set', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _v;
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithAuthorization(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        // #region Check input data
        const primary = req.body.primary, contact = req.body.contact;
        if (typeof primary !== 'string' || typeof contact !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        if (primary === contact)
            return res.status(400).json({ 'message': 'Primary and contact emails can\'t be the same.' });
        // #endregion
        yield RSEngine_1.RSRandom.Wait(50, 100);
        // #region Check if emails are valid
        const primaryEmail = yield db_1.LegacyEmail.GetById(primary);
        if (!primaryEmail)
            return res.status(400).json({ 'message': 'Invalid primary email.' });
        if (primaryEmail.userId !== user.id)
            return res.status(403).json({ 'message': 'Invalid primary email.' });
        if (!primaryEmail.verified)
            return res.status(403).json({ 'message': 'Primary email is not verified.' });
        const contactEmail = contact === 'none' ? null : yield db_1.LegacyEmail.GetById(contact);
        if (contact !== 'none') {
            if (!contactEmail)
                return res.status(400).json({ 'message': 'Invalid contact email.' });
            if (contactEmail.userId !== user.id)
                return res.status(403).json({ 'message': 'Invalid contact email.' });
            if (!contactEmail.verified)
                return res.status(403).json({ 'message': 'Contact email is not verified.' });
        }
        // #endregion
        const _prim = yield user.GetPrimaryEmail();
        const _cont = yield user.GetContactEmail();
        if (_prim.id !== primaryEmail.id) {
            yield user.SetPrimaryEmail(primaryEmail.id);
            db_1.UserAuditLog.Add(user.id, (_v = req.useragent) === null || _v === void 0 ? void 0 : _v.source, db_1.UserAuditLog.Type.MAIN_EMAIL_CHANGE, db_1.UserAuditLog.Relevance.MEDIUM);
        }
        if (_cont && contactEmail) {
            if (_cont.id !== contactEmail.id)
                yield user.SetContactEmail(contactEmail.id);
        }
        else if (_cont && !contactEmail)
            yield user.UnsetContactEmail();
        else if (!_cont && contactEmail)
            yield user.SetContactEmail(contactEmail.id);
        res.status(200).json({ 'message': 'LegacyEmail settings updated successfully.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/email/send-verification', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithAuthorization(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        const email = req.body.email;
        if (typeof email !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        const emailObj = yield db_1.LegacyEmail.GetById(email);
        if (!emailObj)
            return res.status(400).json({ 'message': 'Invalid email.' });
        if (emailObj.userId !== user.id)
            return res.status(400).json({ 'message': 'Invalid email.' });
        if (emailObj.verified)
            return res.status(400).json({ 'message': 'LegacyEmail already verified.' });
        yield RSEngine_1.RSRandom.Wait(50, 100);
        yield emailObj.Send(db_1.LegacyEmail.MailType.VERIFY);
        res.status(200).json({
            'message': 'If that email exists and is not being used by another account, you will receive a verification email shortly.'
        });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/email/delete', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _w;
    const conn = yield db_1.pgConn.connect();
    try {
        const __res = yield validateRequestWithAuthorization(req, res, next);
        if (!__res)
            return;
        const user = __res.user;
        const email = req.body.email;
        if (typeof email !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        const emailObj = yield db_1.LegacyEmail.GetById(email);
        if (!emailObj)
            return res.status(400).json({ 'message': 'Invalid email.' });
        if (emailObj.userId !== user.id)
            return res.status(400).json({ 'message': 'Invalid email.' });
        if (emailObj.type === db_1.LegacyEmail.Type.PRIMARY)
            return res.status(400).json({ 'message': 'You can\'t remove your primary email.' });
        yield RSEngine_1.RSRandom.Wait(50, 100);
        yield emailObj.Delete();
        db_1.UserAuditLog.Add(user.id, (_w = req.useragent) === null || _w === void 0 ? void 0 : _w.source, db_1.UserAuditLog.Type.EMAIL_REMOVE, db_1.UserAuditLog.Relevance.MEDIUM);
        res.status(200).json({ 'message': 'LegacyEmail deleted successfully.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
router.post('/session/delete', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _x;
    const conn = yield db_1.pgConn.connect();
    try {
        const tokenData = yield validateRequest(req, res, next);
        if (!tokenData)
            return;
        const user = yield tokenData.token.GetUser();
        const session = req.body.session;
        if (typeof session !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid request.'));
        if (session === tokenData.token.id)
            return res.status(400).json({ 'message': 'You can\'t delete your current session.' });
        const sessionObj = yield db_1.UserToken.Get(session);
        if (!sessionObj)
            return res.status(400).json({ 'message': 'Invalid session.' });
        if (sessionObj.usrid !== user.id)
            return res.status(400).json({ 'message': 'Invalid session.' });
        yield sessionObj.Destroy();
        db_1.UserAuditLog.Add(user.id, (_x = req.useragent) === null || _x === void 0 ? void 0 : _x.source, db_1.UserAuditLog.Type.LOGOUT, db_1.UserAuditLog.Relevance.LOW);
        res.status(200).json({ 'message': 'Session closed successfully.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal error.'));
    }
    finally {
        conn.release();
    }
}));
module.exports = router;
//# sourceMappingURL=settings.js.map