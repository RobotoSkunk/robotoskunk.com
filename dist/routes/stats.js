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
const router = express_1.default.Router();
const http_errors_1 = __importDefault(require("http-errors"));
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(404, 'Not found.'));
        const user = yield tokenData.token.GetUser();
        if (!(user.roles.has('OWNER') || user.roles.has('ADMIN')))
            return next((0, http_errors_1.default)(404, 'Not found.'));
        res.rs.html.meta.title = 'Stats';
        res.rs.server.aEnabled = false;
        res.rs.html.head = `<link href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" rel="preload">
			<link href="/resources/css/lib/svgMap.min.css" rel="preload">
			<link href="/resources/css/stats.css" rel="preload">

			<link href="/resources/css/bored-stuff.css?v=${res.rs.env.version}" rel="stylesheet">
			<link href="/resources/css/lib/svgMap.min.css" rel="stylesheet">
			<link href="/resources/css/stats.css" rel="stylesheet">

			<script defer src="/resources/js/lib/svg-pan-zoom.min.js" nonce="${res.rs.server.nonce}"></script>
			<script defer src="/resources/js/lib/svgMap.min.js" nonce="${res.rs.server.nonce}"></script>
			<script defer src="/resources/js/stats.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('stats.ejs'));
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=stats.js.map