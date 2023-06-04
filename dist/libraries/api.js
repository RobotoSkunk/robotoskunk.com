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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthScopes = exports.API = void 0;
const db_utils_1 = require("./db-utils");
Object.defineProperty(exports, "OAuthScopes", { enumerable: true, get: function () { return db_utils_1.OAuthScopes; } });
const db_1 = require("./db");
const globals_1 = require("../globals");
const crypto_1 = __importDefault(require("crypto"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
var API;
(function (API) {
    class App {
        constructor(id, name, teamId, redirects, permissions, rateLimit) {
            this.id = id;
            this.name = name;
            this.teamId = teamId;
            this.redirects = redirects;
            this.permissions = permissions;
            this.rateLimit = rateLimit;
        }
        LoadFullData() {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    const res = yield conn.query(`SELECT * FROM api_app WHERE id = $1`, [this.id]);
                    if (res.rowCount === 0)
                        throw new Error(`App with id ${this.id} does not exist.`);
                    const row = res.rows[0];
                    this.description = row._desc;
                    this.createdAt = row.created_at;
                    this.verifiedAt = row.verified_at;
                    this.website = row.website;
                    this.url_TOS = row.url_tos;
                    this.url_Privacy = row.url_privacy;
                    this.minimumAge = row.minimum_age;
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        Save() {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    yield conn.query(`UPDATE api_app SET _name = $1, _desc = $2, website = $3, url_tos = $4, url_privacy = $5, minimum_age = $6, url_redirects = $7, permissions = $8, rate_limit = $9 WHERE id = $10`, [
                        this.name,
                        this.description,
                        this.website,
                        this.url_TOS,
                        this.url_Privacy,
                        this.minimumAge,
                        this.redirects,
                        this.permissions,
                        this.rateLimit,
                        this.id
                    ]);
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        GetNewToken() {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    const token = RSEngine_1.RSCrypto.RandomBytes(64);
                    const hash = RSEngine_1.RSCrypto.HMAC(token, globals_1.env.keys.HMAC);
                    yield conn.query(`UPDATE api_app SET secret = $1 WHERE id = $2`, [hash, this.id]);
                    return token;
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        static Set(name, teamId) {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    const token = crypto_1.default.randomBytes(32).toString('hex');
                    const res = yield conn.query(`INSERT INTO api_app (_name, _tid, secret) VALUES ($1, $2, $3) RETURNING id`, [name, teamId, token]);
                    return res.rows[0].id;
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        static GetById(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    const res = yield conn.query(`SELECT id, _name, _tid, url_redirects, permissions, rate_limit FROM api_app WHERE id = $1`, [id]);
                    if (res.rowCount === 0)
                        return null;
                    const row = res.rows[0];
                    return new App(row.id, row._name, row._tid, row.url_redirects, row.permissions, row.rate_limit);
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        static GetByTeamId(teamId) {
            return __asyncGenerator(this, arguments, function* GetByTeamId_1() {
                const conn = yield __await(db_1.pgConn.connect());
                try {
                    const res = yield __await(conn.query(`SELECT id FROM api_app WHERE _tid = $1`, [teamId]));
                    if (res.rowCount === 0)
                        return yield __await(void 0);
                    for (const row of res.rows)
                        yield yield __await(yield __await(App.GetById(row.id)));
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
    }
    API.App = App;
    class Team {
        constructor(id, name) {
            this.id = id;
            this.name = name;
        }
        LoadFullData() {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    const res = yield conn.query(`SELECT * FROM api_team WHERE id = $1`, [this.id]);
                    if (res.rowCount === 0)
                        throw new Error(`Team with id ${this.id} does not exist.`);
                    const row = res.rows[0];
                    this.createdAt = row.created_at;
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        Save() {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    yield conn.query(`UPDATE api_team SET _name = $1 WHERE id = $2`, [this.name, this.id]);
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
        static Set(name, uid) {
            return __awaiter(this, void 0, void 0, function* () {
                const conn = yield db_1.pgConn.connect();
                try {
                    const res = yield conn.query(`INSERT INTO api_team (_name, _uid) VALUES ($1, $2) RETURNING id`, [name, uid]);
                    const id = res.rows[0].id;
                    yield conn.query(`INSERT INTO api_team_member (_tid, _uid, _lvl, accepted) VALUES ($1, $2, $3, true)`, [id, uid, Team.Role.OWNER]);
                    return res.rows[0].id;
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    conn.release();
                }
            });
        }
    }
    API.Team = Team;
    (function (Team) {
        let Role;
        (function (Role) {
            Role[Role["MEMBER"] = 0] = "MEMBER";
            Role[Role["ADMIN"] = 1] = "ADMIN";
            Role[Role["OWNER"] = 2] = "OWNER";
        })(Role = Team.Role || (Team.Role = {}));
    })(Team = API.Team || (API.Team = {}));
})(API = exports.API || (exports.API = {}));
//# sourceMappingURL=api.js.map