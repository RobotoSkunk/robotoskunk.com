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
const http_errors_1 = __importDefault(require("http-errors"));
const analytics_1 = require("../../libraries/analytics");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const router = express_1.default.Router();
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dnt = req.headers['dnt'];
        if (dnt === '1' && globals_1.env.production)
            return res.status(403).json({ message: 'DNT is enabled.', dnt: true });
        if (!req.headers['user-agent'])
            return next((0, http_errors_1.default)(400, 'No user agent provided.'));
        if (req.useragent.isBot)
            return next((0, http_errors_1.default)(403, 'Bot detected.'));
        const body = req.body;
        if (typeof body.screen !== 'object' || body.screen.length !== 2)
            return next((0, http_errors_1.default)(400, 'Invalid screen size.'));
        if (typeof body.path !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid path.'));
        if (typeof body.timezone !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid timezone.'));
        if (typeof body.screen[0] !== 'number' || typeof body.screen[1] !== 'number')
            return next((0, http_errors_1.default)(400, 'Invalid screen size.'));
        if (!RSEngine_1.RSUtils.ValidURL(body.path))
            return next((0, http_errors_1.default)(400, 'Invalid path.'));
        if (body.referrer) {
            if (typeof body.referrer !== 'string')
                return next((0, http_errors_1.default)(400, 'Invalid referrer.'));
            if (!RSEngine_1.RSUtils.ValidURL(body.referrer))
                return next((0, http_errors_1.default)(400, 'Invalid referrer.'));
            const referrer = new URL(body.referrer);
            if (referrer.hostname === globals_1.env.domain)
                return res.status(200).json({ message: 'IGNORED' });
            switch (referrer.hostname) {
                case 't.co':
                    body.referrer = 'https://twitter.com';
                    break;
                case 'goo.gl':
                    body.referrer = 'https://google.com';
                    break;
                case 'bit.ly':
                    body.referrer = 'https://bitly.com';
                    break;
            }
        }
        try {
            const href = new URL(body.path);
            yield analytics_1.Analytics.SetVisit(body.timezone, href.pathname, body.screen, body.referrer, RSEngine_1.RSUtils.AnonymizeAgent(req.useragent.source));
        }
        catch (e) {
            globals_1.logger.error(e);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }
        res.status(200).json({ message: 'OK' });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Internal Server Error'));
    }
}));
module.exports = router;
//# sourceMappingURL=collect.js.map