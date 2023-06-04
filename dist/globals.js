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
exports.loggerStream = exports.phrases = exports.logger = exports.env = exports.regex = exports.PORT = void 0;
const env_1 = __importDefault(require("./env"));
exports.env = env_1.default;
const phrases_1 = __importDefault(require("./data/phrases"));
exports.phrases = phrases_1.default;
const logger_1 = require("./libraries/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
Object.defineProperty(exports, "loggerStream", { enumerable: true, get: function () { return logger_1.loggerStream; } });
env_1.default.production = process.env.NODE_ENV === 'production';
if (!env_1.default.production) {
    env_1.default.root = 'http://localhost';
    env_1.default.domain = 'localhost';
    env_1.default.hcaptcha_keys = {
        site_key: '10000000-ffff-ffff-ffff-000000000001',
        secret_key: '0x0000000000000000000000000000000000000000'
    };
}
phrases_1.default.push(`<!-- There's a ${(1 / (phrases_1.default.length + 1) * 100).toFixed(2)}% chance to get a phrase! -->`);
exports.PORT = 8000;
// Length exception: regex can't be reduced to match 120 characters
exports.regex = {
    email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    username: /^[a-zA-ZÀ-ÿ0-9 \[\]|#()_-]+$/,
    handler: /^[a-zA-Z0-9_-]+$/,
    uuid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
};
//# sourceMappingURL=globals.js.map