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
const ejs_1 = __importDefault(require("ejs"));
const http_errors_1 = __importDefault(require("http-errors"));
const rateLimiter_1 = require("../../libraries/rateLimiter");
const db_1 = require("../../libraries/db");
const globals_1 = require("../../globals");
const core_1 = require("@zxcvbn-ts/core");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData) {
            if (typeof req.query.token !== 'string')
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            const tok = yield db_1.PasswordToken.Get(req.query.token);
            if (!tok)
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            if (!(yield tok.Authorize(req.query.token)))
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
        }
        res.rs.html.meta.setSubtitle('Change password');
        res.rs.html.head = `<script defer src="/resources/js/reset-password.js?v=${globals_1.env.version}" nonce="${res.rs.server.nonce}"></script>
			<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>

			<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
			<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">`;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('accounts/change-password.ejs'), {
            isLogged: !!tokenData,
            csrf: tokenData ? yield tokenData.token.GenerateCSRF() : '',
            token: req.query.token,
            key: globals_1.env.hcaptcha_keys.site_key
        });
        res.renderDefault('layout-api-form.ejs', { useZxcvbn: true });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error'));
    }
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        yield (0, rateLimiter_1.rateLimiterBruteForce)(req, res, next);
    }
    catch (e) {
        return next((0, http_errors_1.default)(429, 'Too many requests.'));
    }
    if (typeof req.body['h-captcha-response'] !== 'string')
        return next((0, http_errors_1.default)(400, 'Bad request'));
    if (!(yield RSEngine_1.RSUtils.VerifyCaptcha(req.body['h-captcha-response'], globals_1.env.hcaptcha_keys.secret_key)))
        return next((0, http_errors_1.default)(400, 'Bad request'));
    try {
        if (typeof req.body.password !== 'string')
            return next((0, http_errors_1.default)(400, 'Bad request'));
        const tokenData = yield res.rs.client.token();
        var tok = null;
        var user = null;
        if (!tokenData) {
            if (typeof req.body.token !== 'string')
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            tok = yield db_1.PasswordToken.Get(req.body.token);
            if (!tok)
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            if (!(yield tok.Authorize(req.body.token)))
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            user = yield db_1.LegacyUser.GetById(tok.uid);
        }
        else {
            if (typeof req.body.csrf !== 'string' || typeof req.body['old-password'] !== 'string')
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            if (!(yield tokenData.token.ValidateCSRF(req.body.csrf)))
                return next((0, http_errors_1.default)(403, 'Unauthorized'));
            user = yield tokenData.token.GetUser();
            const _limiterKey = RSEngine_1.RSCrypto.HMAC(`${req.ip}:${user.id}`, globals_1.env.keys.RATE_LIMITER);
            try {
                const r = yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.get(_limiterKey);
                if (r !== null) {
                    if (r.consumedPoints > rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.points) {
                        var ms = r.msBeforeNext;
                        (0, rateLimiter_1.__setHeader)(res, ms);
                        return res.status(429).json({ message: `Too many failed attempts. Please try again in ${RSEngine_1.RSTime.ToString(ms)}.` });
                    }
                }
            }
            catch (_) { }
            if (!(yield user.VerifyPassword(req.body['old-password']))) {
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
                        yield db_1.UserAuditLog.Add(user.id, (_a = req.useragent) === null || _a === void 0 ? void 0 : _a.source, db_1.UserAuditLog.Type.FAILED_PASSWORD_CHANGE, db_1.UserAuditLog.Relevance.HIGH);
                    }
                    catch (e) {
                        globals_1.logger.error(e);
                    }
                    return res.status(429).json({
                        'code': 0,
                        'message': 'Too many failed attempts. ' + msg
                    });
                }
                return res.status(400).json({ 'code': 0, 'message': 'Wrong password.' });
            }
        }
        const password = req.body.password;
        if ((0, core_1.zxcvbn)(password).score <= 2)
            return res.status(400).json({ 'code': 0, 'message': 'Password is too weak.' });
        yield user.ChangePassword(password);
        if (tok)
            yield tok.Delete();
        try {
            yield db_1.UserAuditLog.Add(user.id, (_b = req.useragent) === null || _b === void 0 ? void 0 : _b.source, db_1.UserAuditLog.Type.PASSWORD_CHANGE, db_1.UserAuditLog.Relevance.MEDIUM);
            const email = yield user.GetPrimaryEmail();
            yield email.Send(db_1.LegacyEmail.MailType.PASSWORD_RESET);
        }
        catch (e) {
            globals_1.logger.error(e);
        }
        res.status(200).json({ 'code': 1, 'message': 'Password changed.' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error'));
    }
}));
module.exports = router;
//# sourceMappingURL=change-password.js.map