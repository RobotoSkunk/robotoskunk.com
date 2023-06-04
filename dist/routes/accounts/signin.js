"use strict";
/*
    robotoskunk.com - The whole main website of RobotoSkunk.
    Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const globals_1 = require("../../globals");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const db_1 = require("../../libraries/db");
const http_errors_1 = __importDefault(require("http-errors"));
const schema_1 = require("../../libraries/schema");
const rateLimiter_1 = require("../../libraries/rateLimiter");
const ejs_1 = __importDefault(require("ejs"));
const router = express_1.default.Router();
var Errors;
(function (Errors) {
    Errors[Errors["SUCCESS"] = 0] = "SUCCESS";
    Errors[Errors["INVALID_BODY"] = 1] = "INVALID_BODY";
    Errors[Errors["INVALID_EMAIL"] = 2] = "INVALID_EMAIL";
    Errors[Errors["INVALID_RECAPTCHA"] = 3] = "INVALID_RECAPTCHA";
    Errors[Errors["INVALID_EMAIL_OR_PASSWORD"] = 4] = "INVALID_EMAIL_OR_PASSWORD";
    Errors[Errors["ACCOUNT_LOCKED_BY_BRUTE_FORCE"] = 5] = "ACCOUNT_LOCKED_BY_BRUTE_FORCE";
    Errors[Errors["REQUIRE_2FA"] = 6] = "REQUIRE_2FA";
    Errors[Errors["INVALID_2FA"] = 7] = "INVALID_2FA";
})(Errors || (Errors = {}));
;
// file deepcode ignore HTTPSourceWithUncheckedType: The type of the object is being checked by Schema.validate()
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = yield db_1.UserToken.SimpleAuth(req.cookies.auth_token || '');
        res.rs.html.meta.description = 'Sign in with your RobotoSkunk account.';
        if (!token) {
            res.rs.html.meta.setSubtitle('Sign In');
            res.rs.html.head = `<script defer src="/resources/js/signin.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>
				<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>

				<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
				<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">`;
            // res.rs.form = {
            // 	'bg': `<div class="bg-image" style="background-image: url('/resources/svg/alex-skunk/sandbox.svg');"></div><div class="bg-filter"></div>`
            // };
            res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('accounts/signin.ejs'), { key: globals_1.env.hcaptcha_keys.site_key });
        }
        else {
            res.rs.html.meta.setSubtitle('Two-Factor Authentication');
            res.rs.html.head = `<script defer src="/resources/js/signin-2fa.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;
            res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('accounts/signin-2fa.ejs'), {
                'csrf': yield token.GenerateCSRF(),
            });
        }
        yield res.renderDefault('layout-api-form.ejs', { denyIfLoggedIn: true });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    res.minify = false;
    yield RSEngine_1.RSRandom.Wait(0, 100);
    if ((_a = req.useragent) === null || _a === void 0 ? void 0 : _a.isBot)
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    try {
        yield (0, rateLimiter_1.rateLimiterBruteForce)(req, res, next);
    }
    catch (e) {
        return next((0, http_errors_1.default)(429, 'Too many requests.'));
    }
    if (yield res.rs.client.token())
        return next((0, http_errors_1.default)(403, 'You are already logged in.'));
    try {
        const body = req.body;
        if (!schema_1.Schema.validate(schema_1.SignInSchema, body)) {
            return res.status(400).json({
                'code': Errors.INVALID_BODY,
                'message': 'Something went wrong. Refresh the page and try again.'
            });
        }
        // #region Check captcha
        var validRecaptcha = false;
        if (body['h-captcha-response'])
            validRecaptcha = yield RSEngine_1.RSUtils.VerifyCaptcha(body['h-captcha-response'], globals_1.env.hcaptcha_keys.secret_key);
        if (!validRecaptcha) {
            res.status(403).json({
                'code': Errors.INVALID_RECAPTCHA,
                'message': 'Invalid captcha.'
            });
            return;
        }
        // #endregion
        // #region Validate fields
        body.email = body.email.toLowerCase().trim();
        if (!globals_1.regex.email.test(body.email)) {
            res.status(400).json({
                'code': Errors.INVALID_EMAIL,
                'message': 'Invalid email.'
            });
            return;
        }
        // #endregion
        const _limiterKey = RSEngine_1.RSCrypto.HMAC(`${req.ip}:${body.email}`, globals_1.env.keys.RATE_LIMITER);
        try {
            const r = yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);
            if (r !== null) {
                if (r.consumedPoints > rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.points) {
                    (0, rateLimiter_1.__setHeader)(res, r.msBeforeNext);
                    res.status(400).json({
                        'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
                        'message': `You have been locked out due to too many failed attempts. Please try again in ${RSEngine_1.RSTime.ToString(r.msBeforeNext)}.`
                    });
                    return;
                }
            }
        }
        catch (_) { }
        const response = yield db_1.LegacyUser.Auth(body.email, body.password);
        switch (response.code) {
            case db_1.LegacyUser.Code.INTERNAL_ERROR:
                next((0, http_errors_1.default)(500, 'Something went wrong while signing in.'));
                return;
            // case LegacyUser.Code.REQUIRE_2FA: return res.status(400).json({ 'code': Errors.REQUIRE_2FA });
            // case LegacyUser.Code.INVALID_2FA:
            case db_1.LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD: {
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
                    try {
                        const email = yield db_1.LegacyEmail.Get(body.email);
                        if (email) {
                            yield db_1.UserAuditLog.Add(email.userId, (_b = req.useragent) === null || _b === void 0 ? void 0 : _b.source, db_1.UserAuditLog.Type.FAILED_LOGIN, db_1.UserAuditLog.Relevance.HIGH
                            // { twofa: Boolean(body.twofa) }
                            );
                        }
                    }
                    catch (e) {
                        globals_1.logger.error(e);
                    }
                    return res.status(403).json({
                        'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
                        'message': 'You have been locked out due to too many failed attempts. ' + msg
                    });
                }
                // if (response.code === LegacyUser.Code.INVALID_2FA) {
                // 	return res.status(403).json({
                // 		'code': Errors.INVALID_2FA,
                // 		'message': 'Invalid two-factor authentication code.'
                // 	});
                // }
                return res.status(403).json({
                    'code': Errors.INVALID_EMAIL_OR_PASSWORD,
                    'message': 'Wrong email or password.'
                });
            }
        }
        const twofactor = yield response.user.Enabled2FA();
        const tokenResponse = yield db_1.UserToken.Set(response.user.id, req.body.remember == 'on', req.headers['user-agent'], !twofactor);
        if (!tokenResponse) {
            next((0, http_errors_1.default)(500, 'Something went wrong while registering token.'));
            return;
        }
        yield db_1.UserAuditLog.Add(response.user.id, (_c = req.useragent) === null || _c === void 0 ? void 0 : _c.source, db_1.UserAuditLog.Type.LOGIN, db_1.UserAuditLog.Relevance.MEDIUM, { needs2FA: twofactor }
        // { twofa: Boolean(body.twofa) }
        );
        yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.delete(_limiterKey);
        res.status(200).cookie('auth_token', tokenResponse.text, tokenResponse.token.GetCookieParams(res.rs.client.isOnion)).json({
            code: 0,
            message: 'OK',
            twofa: twofactor
        });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, e.message));
    }
}));
router.post('/twofa', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    if ((_d = req.useragent) === null || _d === void 0 ? void 0 : _d.isBot)
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    try {
        yield (0, rateLimiter_1.rateLimiterBruteForce)(req, res, next);
    }
    catch (e) {
        return next((0, http_errors_1.default)(429, 'Too many requests.'));
    }
    const token = yield db_1.UserToken.SimpleAuth(req.cookies.auth_token || '');
    if (!token)
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    const body = req.body;
    if (typeof body.twofa !== 'string' || typeof body.csrf !== 'string')
        return next((0, http_errors_1.default)(400, 'Invalid body.'));
    if (isNaN(Number.parseInt(body.twofa)))
        return res.status(400).json({ message: 'The code must be a number.' });
    if (!(yield token.ValidateCSRF(body.csrf)))
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    const user = yield token.GetUser(), twofactor = yield user.Enabled2FA();
    if (!twofactor)
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    const _limiterKey = RSEngine_1.RSCrypto.HMAC(`${req.ip}:${user.id}`, globals_1.env.keys.RATE_LIMITER);
    try {
        const r = yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);
        if (r !== null) {
            if (r.consumedPoints > rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.points) {
                (0, rateLimiter_1.__setHeader)(res, r.msBeforeNext);
                return res.status(429).json({
                    'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
                    'message': `You have been locked out due to too many failed attempts. Please try again in ${RSEngine_1.RSTime.ToString(r.msBeforeNext)}.`
                });
            }
        }
    }
    catch (_) { }
    if (!(yield user.Verify2FA(body.twofa))) {
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
            try {
                yield db_1.UserAuditLog.Add(user.id, (_e = req.useragent) === null || _e === void 0 ? void 0 : _e.source, db_1.UserAuditLog.Type.FAILED_LOGIN, db_1.UserAuditLog.Relevance.HIGH, { twofa: true });
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            return res.status(403).json({
                'code': Errors.ACCOUNT_LOCKED_BY_BRUTE_FORCE,
                'message': 'You have been locked out due to too many failed attempts. ' + msg
            });
        }
        return res.status(403).json({
            'code': Errors.INVALID_2FA,
            'message': 'Wrong two-factor authentication code.'
        });
    }
    yield token.TwoFactorAuth();
    yield db_1.UserAuditLog.Add(user.id, (_f = req.useragent) === null || _f === void 0 ? void 0 : _f.source, db_1.UserAuditLog.Type.LOGIN, db_1.UserAuditLog.Relevance.MEDIUM);
    yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.delete(_limiterKey);
    res.status(200).json({
        code: 0,
        message: 'OK'
    });
}));
module.exports = router;
//# sourceMappingURL=signin.js.map