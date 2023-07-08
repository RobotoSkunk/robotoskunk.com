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
const globals_1 = require("../globals");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const http_errors_1 = __importDefault(require("http-errors"));
const zxcvbn_1 = require("../libraries/zxcvbn");
const rateLimiter_1 = require("../libraries/rateLimiter");
const ejs_1 = __importDefault(require("ejs"));
const EmailQueue_1 = require("../libraries/database/tokens/EmailQueue");
const dotcomcore_1 = __importDefault(require("dotcomcore"));
const Email_1 = require("../libraries/database/Email");
const MailQueue_1 = require("../libraries/database/MailQueue");
const User_1 = require("../libraries/database/User");
const router = express_1.default.Router();
var Errors;
(function (Errors) {
    Errors[Errors["SUCCESS"] = 0] = "SUCCESS";
    Errors[Errors["INVALID_BODY"] = 1] = "INVALID_BODY";
    Errors[Errors["INVALID_EMAIL"] = 2] = "INVALID_EMAIL";
    Errors[Errors["INVALID_USERNAME"] = 3] = "INVALID_USERNAME";
    Errors[Errors["INVALID_PASSWORD"] = 4] = "INVALID_PASSWORD";
    Errors[Errors["INVALID_CAPTCHA"] = 5] = "INVALID_CAPTCHA";
    Errors[Errors["INVALID_BIRTHDATE"] = 6] = "INVALID_BIRTHDATE";
})(Errors || (Errors = {}));
// file deepcode ignore HTTPSourceWithUncheckedType: The type of the object is being checked by Schema.validate()
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.rs.html.meta.setSubtitle('Sign Up');
        res.rs.html.meta.description = 'Sign up for an account';
        res.addToHead({
            type: 'js',
            source: 'https://js.hcaptcha.com/1/api.js'
        });
        if (req.query.token) {
            const token = yield EmailQueue_1.EmailQueue.GetToken(req.query.token);
            if (token === null) {
                return next((0, http_errors_1.default)(403, 'Invalid token.'));
            }
            const email = yield token.GetEmail();
            res.addToHead({
                type: 'js',
                source: `/resources/js/signup-last-step.js`
            }, {
                type: 'link',
                rel: 'preload',
                source: '/resources/svg/eye-enable.svg',
                as: 'image',
                mimeType: 'image/svg+xml'
            }, {
                type: 'link',
                rel: 'preload',
                source: '/resources/svg/eye-disable.svg',
                as: 'image',
                mimeType: 'image/svg+xml'
            });
            const today = new Date();
            const max = new Date();
            const min = new Date();
            min.setFullYear(today.getFullYear() - 130);
            max.setFullYear(today.getFullYear() - 13);
            res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('signup-last-step.ejs'), {
                key: globals_1.env.hcaptcha_keys.site_key,
                min: min.toISOString().split('T')[0],
                max: max.toISOString().split('T')[0],
                email: yield email.Read(yield email.GenericCryptoKey())
            });
            yield res.renderDefault('layout-api-form.ejs', {
                denyIfLoggedIn: true,
                useZxcvbn: true
            });
            return;
        }
        res.addToHead({
            type: 'js',
            source: `/resources/js/signup-first-step.js`
        });
        // res.rs.form = {
        // 	'bg': `<div class="bg-image" style="background-image: url('/resources/svg/alex-skunk/sandbox.svg');"></div><div class="bg-filter"></div>`
        // };
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('signup-first-step.ejs'), {
            key: globals_1.env.hcaptcha_keys.site_key
        });
        yield res.renderDefault('layout-api-form.ejs', {
            denyIfLoggedIn: true
        });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
/**
 * Checks if the request is valid.
 */
function genericChecker(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        res.minify = false;
        yield RSEngine_1.RSRandom.Wait(0, 100);
        if ((_a = req.useragent) === null || _a === void 0 ? void 0 : _a.isBot)
            return 403;
        try {
            yield (0, rateLimiter_1.rateLimiterBruteForce)(req, res, next);
        }
        catch (e) {
            return 429;
        }
        if (yield res.rs.client.token()) {
            return 403;
        }
        const body = req.body;
        // #region Check captcha
        var validRecaptcha = false;
        if (body['h-captcha-response']) {
            validRecaptcha = yield RSEngine_1.RSUtils.VerifyCaptcha(body['h-captcha-response'], globals_1.env.hcaptcha_keys.secret_key);
        }
        if (!validRecaptcha) {
            res.status(403).json({
                'code': Errors.INVALID_CAPTCHA,
                'message': 'Invalid captcha.'
            });
            return -1;
        }
        // #endregion
        return 0;
    });
}
router.post('/email', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // #region Check if the request is valid
        const result = yield genericChecker(req, res, next);
        if (typeof req.body.email !== 'string') {
            return next((0, http_errors_1.default)(400, 'Invalid email.'));
        }
        if (result === -1) {
            return;
        }
        if (result !== 0) {
            return next((0, http_errors_1.default)(result, 'Something went wrong.'));
        }
        // #endregion
        const client = yield dotcomcore_1.default.Core.Connect();
        try {
            // Check if the email is valid or not
            if (!(yield Email_1.Email.VerifyIfValid(req.body.email))) {
                return res.status(400).json({
                    'code': Errors.INVALID_EMAIL,
                    'message': 'Invalid email.'
                });
            }
            // Check if the email is already in use
            if (yield Email_1.Email.Exists(req.body.email)) {
                return;
            }
            // Add the email to the queue
            const email = yield Email_1.Email.Set(req.body.email);
            const token = yield EmailQueue_1.EmailQueue.Add(email);
            const template = yield MailQueue_1.MailQueue.GenerateTemplate('createAccount', req.body.email, {
                link: `https://${globals_1.env.domain}/signup?token=${token.id}.${token.originalValidator}`
            });
            yield MailQueue_1.MailQueue.SendEmail(req.body.email, 'Continue your sign up', template);
            // Send a success message
            res.status(200).json({
                'code': 0,
                'message': 'OK'
            });
        }
        catch (e) {
            globals_1.logger.error(e);
            next((0, http_errors_1.default)(500, e));
        }
        finally {
            client.release();
        }
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // #region Check if the request is valid
        const result = yield genericChecker(req, res, next);
        const required = ['username', 'password', 'birthdate', 'token'];
        for (const r of required) {
            if (typeof req.body[r] !== 'string') {
                return next((0, http_errors_1.default)(400, 'Invalid body.'));
            }
        }
        if (result === -1) {
            return;
        }
        if (result !== 0) {
            return next((0, http_errors_1.default)(result, 'Something went wrong.'));
        }
        const token = yield EmailQueue_1.EmailQueue.GetToken(req.body.token);
        if (token === null) {
            return next((0, http_errors_1.default)(403, 'Invalid token.'));
        }
        const birthdateTimestamp = Number.parseInt(req.body.birthdate);
        if (Number.isNaN(birthdateTimestamp)) {
            return next((0, http_errors_1.default)(400, 'Invalid birthdate.'));
        }
        const birthdate = new Date(birthdateTimestamp);
        if (!birthdate) {
            return next((0, http_errors_1.default)(400, 'Invalid birthdate.'));
        }
        birthdate.setHours(12, 0, 0, 0);
        if (!RSEngine_1.RSTime.MinimumAge(birthdate)) {
            return res.status(400).json({
                'code': Errors.INVALID_BIRTHDATE,
                'message': 'You must be at least 13 years old.'
            });
        }
        if (birthdate.getTime() < Date.now() - RSEngine_1.RSTime._YEAR_ * 130) {
            return res.status(400).json({
                'code': Errors.INVALID_BIRTHDATE,
                'message': 'Really funny, but you are not that old.'
            });
        }
        if (!globals_1.regex.handler.test(req.body.username)) {
            return res.status(400).json({
                'code': Errors.INVALID_USERNAME,
                'message': 'Username can only contain letters, numbers, underscores and dashes.'
            });
        }
        if (req.body.username.length < 3 || req.body.username.length > 16) {
            return res.status(400).json({
                'code': Errors.INVALID_USERNAME,
                'message': 'Username must be between 3 and 16 characters.'
            });
        }
        if (yield User_1.User.ExistsByHandler(req.body.username)) {
            return res.status(400).json({
                'code': Errors.INVALID_USERNAME,
                'message': 'Username is already taken.'
            });
        }
        if ((0, zxcvbn_1.zxcvbn)(req.body.password).score <= 2) {
            return res.status(400).json({
                'code': Errors.INVALID_PASSWORD,
                'message': 'Password is too weak.'
            });
        }
        // #endregion
        yield RSEngine_1.RSRandom.Wait(0, 150);
        const email = yield token.GetEmail();
        if (!email.userId) {
            User_1.User.Set(req.body.username, email.id, req.body.password, birthdate);
        }
        res.status(200).json({
            'code': 0,
            'message': 'OK'
        });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=signup.js.map