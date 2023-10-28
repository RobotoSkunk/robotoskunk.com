"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerStream = exports.phrases = exports.logger = exports.conf = exports.regex = exports.PORT = void 0;
const conf_1 = __importDefault(require("./conf"));
exports.conf = conf_1.default;
const phrases_1 = __importDefault(require("./data/phrases"));
exports.phrases = phrases_1.default;
const logger_1 = require("./libs/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
Object.defineProperty(exports, "loggerStream", { enumerable: true, get: function () { return logger_1.loggerStream; } });
conf_1.default.production = process.env.NODE_ENV === 'production';
if (!conf_1.default.production) {
    conf_1.default.root = 'http://localhost';
    conf_1.default.domain = 'localhost';
    conf_1.default.hcaptcha_keys = {
        site_key: '10000000-ffff-ffff-ffff-000000000001',
        secret_key: '0x0000000000000000000000000000000000000000'
    };
}
phrases_1.default.push(`<!-- There's a ${(1 / (phrases_1.default.length + 1) * 100).toFixed(2)}% chance to get a phrase! -->`);
exports.PORT = process.env.PORT || 8000;
// Length exception: regex can't be reduced to match 120 characters
exports.regex = {
    email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    username: /^[a-zA-ZÀ-ÿ0-9 \[\]|#()_-]+$/,
    handler: /^[a-zA-Z0-9_-]+$/,
    uuid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
};
//# sourceMappingURL=globals.js.map