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
const http_errors_1 = __importDefault(require("http-errors"));
const globals_1 = require("../globals");
const db_1 = require("../libraries/db");
const rateLimiter_1 = require("../libraries/rateLimiter");
const router = express_1.default.Router();
router.get('/:token', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield (0, rateLimiter_1.rateLimiterBruteForce)(req, res, next);
    }
    catch (e) {
        return next((0, http_errors_1.default)(429, 'Too many requests.'));
    }
    const tokenData = yield res.rs.client.token();
    var redirect = tokenData ? '/accounts/settings' : '/accounts/signin?verified=1';
    if ((_a = req.useragent) === null || _a === void 0 ? void 0 : _a.isBot)
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    try {
        if (yield db_1.LegacyEmail.Verify(req.params.token))
            return res.redirect(redirect);
        next((0, http_errors_1.default)(403, 'Forbidden'));
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=verify-email.js.map