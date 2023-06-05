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
const db_1 = require("../libraries/db");
const http_errors_1 = __importDefault(require("http-errors"));
const schema_1 = require("../libraries/schema");
const zxcvbn_1 = require("../libraries/zxcvbn");
const rateLimiter_1 = require("../libraries/rateLimiter");
const ejs_1 = __importDefault(require("ejs"));
const EmailQueue_1 = require("../libraries/database/tokens/EmailQueue");
const dotcomcore_1 = __importDefault(require("dotcomcore"));
const Email_1 = require("../libraries/database/Email");
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
        if (req.query.token) {
            if (!(yield EmailQueue_1.EmailQueue.ValidateToken(req.query.token))) {
                return next((0, http_errors_1.default)(403, 'Invalid token.'));
            }
            const today = new Date();
            const max = new Date();
            const min = new Date();
            min.setFullYear(today.getFullYear() - 130);
            max.setFullYear(today.getFullYear() - 13);
            res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('signup-last-step.ejs'), {
                key: globals_1.env.hcaptcha_keys.site_key,
                min: min.toISOString().split('T')[0],
                max: max.toISOString().split('T')[0]
            });
            yield res.renderDefault('layout-api-form.ejs', {
                denyIfLoggedIn: true,
                useZxcvbn: true
            });
            return;
        }
        res.addToHead({
            type: 'js',
            source: 'https://js.hcaptcha.com/1/api.js'
        }, {
            type: 'js',
            source: `/resources/js/signup-first-step.js`
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
        var validRecaptcha = true;
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
        const result = yield genericChecker(req, res, next);
        if (result === -1) {
            return;
        }
        if (result !== 0) {
            return next((0, http_errors_1.default)(result, 'Something went wrong.'));
        }
        const client = yield dotcomcore_1.default.Core.Connect();
        try {
            if (!(yield Email_1.Email.VerifyIfValid(req.body.email))) {
                return res.status(400).json({
                    'code': Errors.INVALID_EMAIL,
                    'message': 'Invalid email.'
                });
            }
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
    const result = yield genericChecker(req, res, next);
    if (result === -1) {
        return;
    }
    if (result !== 0) {
        return next((0, http_errors_1.default)(result, 'Something went wrong.'));
    }
    const client = yield db_1.pgConn.connect();
    try {
        const body = req.body;
        if (typeof body.birthdate === 'string')
            body.birthdate = Number.parseInt(body.birthdate);
        if (!schema_1.Schema.validate(schema_1.SignUpSchema, body)) {
            return res.status(400).json({
                'code': Errors.INVALID_BODY,
                'message': 'Something went wrong. Refresh the page and try again.'
            });
        }
        // #region Check user data
        body.username = body.username.trim();
        body.email = body.email.trim();
        const bday = new Date(body.birthdate);
        if (!bday) {
            res.status(400).json({
                'code': Errors.INVALID_BIRTHDATE,
                'message': 'Invalid birthdate.'
            });
            return;
        }
        bday.setHours(12, 0, 0, 0);
        if (!RSEngine_1.RSTime.MinimumAge(bday)) {
            return res.status(400).json({
                'code': Errors.INVALID_BIRTHDATE,
                'message': 'You must be at least 13 years old.'
            });
        }
        if (bday.getTime() < Date.now() - RSEngine_1.RSTime._YEAR_ * 130) {
            return res.status(400).json({
                'code': Errors.INVALID_BIRTHDATE,
                'message': 'Really funny, but you are not that old.'
            });
        }
        if (!globals_1.regex.handler.test(body.username)) {
            return res.status(400).json({
                'code': Errors.INVALID_USERNAME,
                'message': 'Username can only contain letters, numbers, underscores and dashes.'
            });
        }
        if (body.username.length < 3 || body.username.length > 16) {
            return res.status(400).json({
                'code': Errors.INVALID_USERNAME,
                'message': 'Username must be between 3 and 16 characters.'
            });
        }
        if (yield db_1.LegacyUser.ExistsByHandler(body.username)) {
            return res.status(400).json({
                'code': Errors.INVALID_USERNAME,
                'message': 'Username is already taken.'
            });
        }
        if ((0, zxcvbn_1.zxcvbn)(body.password).score <= 2) {
            return res.status(400).json({
                'code': Errors.INVALID_PASSWORD,
                'message': 'Password is too weak.'
            });
        }
        if (!(yield db_1.LegacyEmail.Validate(body.email))) {
            return res.status(400).json({
                'code': Errors.INVALID_EMAIL,
                'message': 'Invalid email.'
            });
        }
        // #endregion
        yield RSEngine_1.RSRandom.Wait(0, 150);
        if (!(yield db_1.LegacyEmail.Exists(body.email))) {
            const response = yield db_1.LegacyUser.Set(body.username, body.email, body.password, bday);
            if (response === db_1.LegacyUser.Code.INTERNAL_ERROR)
                return next((0, http_errors_1.default)(500, 'Something went wrong while signing up.'));
            if (response === db_1.LegacyUser.Code.ALREADY_EXISTS) {
                return res.status(403).json({
                    'code': Errors.INVALID_USERNAME,
                    'message': 'Username is already taken.'
                });
            }
            if (response === db_1.LegacyUser.Code.MINOR) {
                return res.status(403).json({
                    'code': Errors.INVALID_BIRTHDATE,
                    'message': 'You must be at least 8 years old.'
                });
            }
        }
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
}));
module.exports = router;
//# sourceMappingURL=signup.js.map