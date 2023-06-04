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
const globals_1 = require("../../globals");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const db_esentials_1 = require("../../libraries/db-esentials");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (tokenData)
            return next((0, http_errors_1.default)(403, 'Unauthorized'));
        res.rs.html.meta.setSubtitle('Forgot password');
        res.rs.html.head = `<script defer src="/resources/js/forgot-password.js?v=${globals_1.env.version}" nonce="${res.rs.server.nonce}"></script>
			<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('accounts/forgot-password.ejs'), {
            key: globals_1.env.hcaptcha_keys.site_key
        });
        res.renderDefault('layout-api-form.ejs');
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error'));
    }
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (tokenData)
            return next((0, http_errors_1.default)(403, 'Unauthorized'));
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
        if (typeof req.body.email !== 'string')
            return next((0, http_errors_1.default)(400, 'Bad request'));
        const email = req.body.email.trim().toLowerCase();
        if (!globals_1.regex.email.test(email))
            return res.status(400).json({ code: 0, message: 'Invalid email address.' });
        res.status(200).json({ code: 1, message: 'OK' });
        const _email = yield db_esentials_1.LegacyEmail.Get(email);
        if (!_email)
            return;
        yield _email.Send(db_esentials_1.LegacyEmail.MailType.PASSWORD_RESET_REQUEST);
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal server error'));
    }
}));
module.exports = router;
//# sourceMappingURL=forgot-password.js.map