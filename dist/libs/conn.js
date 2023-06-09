"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rtConn = exports.pgConn = void 0;
const pg_1 = __importDefault(require("pg"));
const globals_1 = require("../globals");
exports.pgConn = new pg_1.default.Pool({
    'user': globals_1.conf.database.user,
    'password': globals_1.conf.database.password,
    'database': globals_1.conf.database.database,
    'host': globals_1.conf.database.host
});
exports.rtConn = new pg_1.default.Pool({
    'user': globals_1.conf.rateLimiterDatabase.user,
    'password': globals_1.conf.rateLimiterDatabase.password,
    'database': globals_1.conf.rateLimiterDatabase.database,
    'host': globals_1.conf.rateLimiterDatabase.host
});
//# sourceMappingURL=conn.js.map