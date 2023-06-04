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
const db_1 = require("../../libraries/db");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const rateLimiter_1 = require("../../libraries/rateLimiter");
const db_utils_1 = require("../../libraries/db-utils");
const router = express_1.default.Router();
function relativeTime(time, lang = 'en') {
    return {
        time: time.getTime(),
        relative: RSEngine_1.RSTime.RelativeAgo(time, lang)
    };
}
router.get('/:user/:page', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c, _d, e_2, _e, _f;
    const client = yield db_1.pgConn.connect();
    try {
        const tokenData = yield res.rs.client.token();
        var uid = '';
        if (tokenData) {
            const user = yield tokenData.token.GetUser();
            uid = user.id;
        }
        const page = Number.parseInt(req.params.page);
        if (Number.isNaN(page))
            return next((0, http_errors_1.default)(400, 'Invalid page'));
        if (page < 0)
            return next((0, http_errors_1.default)(400, 'Invalid page'));
        const victim = yield db_1.LegacyUser.GetByHandler(req.params.user);
        const _count = yield client.query('SELECT COUNT(1) FROM shouts WHERE victim = $1', [victim.id]);
        const maxPage = Math.ceil(_count.rows[0].count / 10);
        if (page > maxPage)
            return next((0, http_errors_1.default)(400, 'Invalid page'));
        const shouts = [];
        try {
            for (var _g = true, _h = __asyncValues(db_1.Shout.GetByVictim(victim.id, page)), _j; _j = yield _h.next(), _a = _j.done, !_a;) {
                _c = _j.value;
                _g = false;
                try {
                    const shout = _c;
                    const author = yield db_1.LegacyUser.GetById(shout.author);
                    const editHistory = [];
                    try {
                        for (var _k = true, _l = (e_2 = void 0, __asyncValues(shout.GetEdits())), _m; _m = yield _l.next(), _d = _m.done, !_d;) {
                            _f = _m.value;
                            _k = false;
                            try {
                                const edit = _f;
                                editHistory.push({
                                    content: edit.content,
                                    created_at: relativeTime(edit.createdAt)
                                });
                            }
                            finally {
                                _k = true;
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (!_k && !_d && (_e = _l.return)) yield _e.call(_l);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    shouts.push({
                        id: shout.id,
                        author: {
                            name: author ? author.name : '[Deleted LegacyUser]',
                            handler: author ? author.handler : null
                        },
                        content: shout.content,
                        created_at: relativeTime(shout.createdAt),
                        edited_at: shout.editedAt ? relativeTime(shout.editedAt) : null,
                        editable: uid === shout.author,
                        edit_history: editHistory
                    });
                }
                finally {
                    _g = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.status(200).json({
            'page': page,
            'max_page': Math.ceil(_count.rows[0].count / 10),
            'shouts': shouts
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
router.put('/:user', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var cont = req.body.content;
    const client = yield db_1.pgConn.connect();
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(401, 'Unauthorized'));
        const csrf = req.body._csrf;
        if (typeof csrf !== 'string')
            return next((0, http_errors_1.default)(401, 'Invalid CSRF token'));
        if (!(yield tokenData.token.ValidateCSRF(csrf)))
            return next((0, http_errors_1.default)(401, 'Invalid CSRF token'));
        const user = yield tokenData.token.GetUser();
        const blacklist = yield user.CheckBlacklist();
        if ((blacklist & db_utils_1.Blacklist.FLAGS.BANNED) !== 0)
            return next((0, http_errors_1.default)(403, 'You are banned'));
        if ((blacklist & db_utils_1.Blacklist.FLAGS.SHOUTS) !== 0) {
            const status = yield user.CheckSpecificBlacklist(db_utils_1.Blacklist.FLAGS.SHOUTS);
            var reason = 'You are banned from shouting';
            if (status.reason)
                reason += `: ${status.reason}`;
            return res.status(403).json({ 'success': false, 'message': reason });
        }
        const e = yield user.GetPrimaryEmail();
        if (!e.verified)
            return res.status(403).json({ 'success': false, 'message': 'You need to verify your email' });
        const victim = yield db_1.LegacyUser.GetByHandler(req.params.user);
        const response = yield db_1.Shout.Create(user.id, victim.id, cont, (limiter) => { (0, rateLimiter_1.__setHeaderAuto)(res, limiter); });
        switch (response) {
            case db_1.Shout.Code.INTERNAL_ERROR: return next((0, http_errors_1.default)(500, 'Internal error'));
            case db_1.Shout.Code.INVALID_LENGTH: return next((0, http_errors_1.default)(400, 'Invalid content'));
            case db_1.Shout.Code.RATE_LIMITED: return next(rateLimiter_1.__httpError);
        }
        res.status(200).json({ 'success': true });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, e));
    }
    finally {
        client.release();
    }
}));
router.delete('/:user/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number.parseInt(req.params.id);
    if (Number.isNaN(id))
        return next((0, http_errors_1.default)(400, 'Invalid shout id'));
    const client = yield db_1.pgConn.connect();
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(401, 'Unauthorized'));
        const csrf = req.headers._csrf;
        if (typeof csrf !== 'string')
            return next((0, http_errors_1.default)(401, 'Invalid CSRF token'));
        if (!(yield tokenData.token.ValidateCSRF(csrf)))
            return next((0, http_errors_1.default)(401, 'Invalid CSRF token'));
        const user = yield tokenData.token.GetUser();
        if (((yield user.CheckBlacklist()) & db_utils_1.Blacklist.FLAGS.BANNED) !== 0)
            return next((0, http_errors_1.default)(403, 'You are banned'));
        const victim = yield db_1.LegacyUser.GetByHandler(req.params.user);
        const shout = yield db_1.Shout.GetById(id);
        if (!shout)
            return next((0, http_errors_1.default)(404, 'Shout not found'));
        if (shout.author !== user.id || shout.victim !== victim.id)
            return next((0, http_errors_1.default)(403, 'Unauthorized'));
        yield shout.Delete();
        res.status(200).json({ 'success': true });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, e));
    }
    finally {
        client.release();
    }
}));
router.post('/:user/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number.parseInt(req.params.id);
    if (Number.isNaN(id))
        return next((0, http_errors_1.default)(400, 'Invalid shout id'));
    const client = yield db_1.pgConn.connect();
    var cont = req.body.content;
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(401, 'Unauthorized'));
        const csrf = req.body._csrf;
        if (typeof csrf !== 'string')
            return next((0, http_errors_1.default)(401, 'Invalid CSRF token'));
        if (!(yield tokenData.token.ValidateCSRF(csrf)))
            return next((0, http_errors_1.default)(401, 'Invalid CSRF token'));
        const user = yield tokenData.token.GetUser();
        const blacklist = yield user.CheckBlacklist();
        if ((blacklist & db_utils_1.Blacklist.FLAGS.BANNED) !== 0)
            return next((0, http_errors_1.default)(403, 'You are banned'));
        if ((blacklist & db_utils_1.Blacklist.FLAGS.SHOUTS) !== 0) {
            const status = yield user.CheckSpecificBlacklist(db_utils_1.Blacklist.FLAGS.SHOUTS);
            var reason = 'You are banned from shouting';
            if (status.reason)
                reason += `: ${status.reason}`;
            return res.status(403).json({ 'success': false, 'message': reason });
        }
        const victim = yield db_1.LegacyUser.GetByHandler(req.params.user);
        const shout = yield db_1.Shout.GetById(id);
        if (!shout)
            return next((0, http_errors_1.default)(404, 'Shout not found'));
        if (shout.author !== user.id || shout.victim !== victim.id)
            return next((0, http_errors_1.default)(403, 'Unauthorized'));
        const response = yield shout.Update(user.id, cont);
        switch (response) {
            case db_1.Shout.Code.INTERNAL_ERROR: return next((0, http_errors_1.default)(500, 'Internal error'));
            case db_1.Shout.Code.INVALID_LENGTH: return next((0, http_errors_1.default)(400, 'Invalid content'));
            case db_1.Shout.Code.MAXIMUM_EDITS: return next((0, http_errors_1.default)(403, 'Maximum edits reached'));
            case db_1.Shout.Code.NOT_ALLOWED: return next((0, http_errors_1.default)(401, 'Unauthorized'));
        }
        res.status(200).json({ 'success': true });
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
//# sourceMappingURL=shouts.js.map