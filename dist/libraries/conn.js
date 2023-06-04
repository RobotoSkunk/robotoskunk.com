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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rtConn = exports.pgConn = void 0;
const pg_1 = __importDefault(require("pg"));
const globals_1 = require("../globals");
exports.pgConn = new pg_1.default.Pool({
    'user': globals_1.env.database.user,
    'password': globals_1.env.database.password,
    'database': globals_1.env.database.database,
    'host': globals_1.env.database.host
});
exports.rtConn = new pg_1.default.Pool({
    'user': globals_1.env.rateLimiterDatabase.user,
    'password': globals_1.env.rateLimiterDatabase.password,
    'database': globals_1.env.rateLimiterDatabase.database,
    'host': globals_1.env.rateLimiterDatabase.host
});
//# sourceMappingURL=conn.js.map