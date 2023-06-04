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
const ejs_1 = __importDefault(require("ejs"));
const comms_1 = require("../../data/comms");
const db_1 = require("../../libraries/db");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.pgConn.connect();
    try {
        var isAdmin = false, local = [];
        const tokenData = yield res.rs.client.token();
        if (tokenData) {
            const user = yield tokenData.token.GetUser();
            isAdmin = user.roles.has('OWNER');
        }
        const cookie = req.cookies['commissions'];
        if (cookie) {
            try {
                local = JSON.parse(cookie);
                if (!Array.isArray(local))
                    throw new Error('Invalid cookie');
            }
            catch (e) {
                res.clearCookie('commissions');
            }
        }
        res.rs.html.head = `<link rel="preload" href="/resources/css/comms.css" as="style">
			<link rel="stylesheet" href="/resources/css/comms.css">`;
        const open = yield db_1.Commissions.GetOpen();
        const comms = [];
        for (const row of open) {
            var author = null, isOwner = false;
            if (row.author) {
                const _req = yield client.query(`SELECT _handler FROM users WHERE id = $1;`, [row.author]);
                author = _req.rows[0]._handler;
                if (tokenData)
                    isOwner = tokenData.token.usrid === row.author;
            }
            else {
                if (local.includes(row.id))
                    isOwner = true;
            }
            const status = yield db_1.Commissions.GetStatus(row.id);
            comms.push({
                id: row.id,
                label: row._title,
                author: author,
                status: db_1.Commissions.StatusBanner(status, 'negative'),
                allow: isOwner || isAdmin
            });
        }
        var availableSlots = (yield db_1.Config.Get('commissions-limit')) - comms.length;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('commissions/index.ejs'), {
            articles: comms_1.articles,
            commissions: comms,
            isAdmin: isAdmin,
            available: availableSlots
        });
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
    finally {
        client.release();
    }
}));
module.exports = router;
//# sourceMappingURL=index.js.map