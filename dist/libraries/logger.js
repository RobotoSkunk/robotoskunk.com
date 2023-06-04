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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerStream = exports.logger = exports.genTemplate = void 0;
const winston_1 = __importDefault(require("winston"));
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const path_1 = __importDefault(require("path"));
// Logging
const rsFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, metadata = __rest(_a, ["level", "message", "timestamp"]);
    var extras = '';
    if (metadata)
        extras = metadata.stack ? `\n\n${metadata.stack}\n` : (Object.keys(metadata).length ? `\n\n${(0, safe_stable_stringify_1.default)(metadata, null, '\t')}\n` : '');
    if (typeof message === 'object')
        message = (0, safe_stable_stringify_1.default)(message, null, '\t');
    if (typeof message === 'bigint' || typeof message === 'number' || typeof message === 'function')
        message = message.toString();
    if (typeof message === 'boolean')
        message = message ? 'true' : 'false';
    if (message === undefined)
        message = 'undefined';
    if (message === null)
        message = 'null';
    message = message.trim();
    return `[${timestamp}] ${level}: ${message}` + extras;
});
function genTemplate(dirname, filename) {
    return {
        format: winston_1.default.format.combine(winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
        transports: [
            new winston_1.default.transports.Console({
                level: 'debug',
                handleExceptions: true,
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), rsFormat)
            }),
            new winston_1.default.transports.File({
                level: 'warn',
                maxFiles: 5,
                maxsize: 1024 * 1024 * 5,
                format: winston_1.default.format.combine(rsFormat),
                dirname,
                filename
            })
        ]
    };
}
exports.genTemplate = genTemplate;
exports.logger = winston_1.default.createLogger(genTemplate(path_1.default.join(process.cwd(), 'logs'), 'error.log'));
exports.loggerStream = {
    write: (message) => { exports.logger.debug(message); }
};
//# sourceMappingURL=logger.js.map