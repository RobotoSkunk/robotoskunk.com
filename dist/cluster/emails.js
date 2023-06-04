"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
require("source-map-support/register");
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("../env"));
const conn_1 = require("../libraries/conn");
const logger_1 = require("../libraries/logger");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const mailer_1 = require("../libraries/mailer");
function sleep() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, 15000));
    });
}
exports.logger = winston_1.default.createLogger((0, logger_1.genTemplate)(path_1.default.join(process.cwd(), 'logs/mailer'), 'error.log'));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const mailer = new mailer_1.Mailer({
        host: env_1.default.emails.noreply.host,
        port: env_1.default.emails.noreply.port,
        secure: env_1.default.emails.noreply.secure,
        auth: {
            user: env_1.default.emails.noreply.auth.user,
            pass: env_1.default.emails.noreply.auth.pass
        }
    }, exports.logger, mailer_1.Mailer.Mode.Production, env_1.default.root, conn_1.pgConn, env_1.default.keys.MASTER);
    try {
        if (yield mailer.transporter.verify()) {
            exports.logger.info('LegacyEmail server is online.');
        }
        else {
            exports.logger.error('LegacyEmail server does not work.');
            process.exit(1);
        }
    }
    catch (e) {
        exports.logger.error(e);
        process.exit(2);
    }
    while (true) {
        const conn = yield conn_1.pgConn.connect();
        try {
            const { rows } = yield conn.query('SELECT * FROM mail_queue WHERE attempts < 3 ORDER BY created_at ASC LIMIT 1');
            if (rows.length === 0) {
                yield sleep();
                continue;
            }
            const row = rows[0];
            try {
                const key = yield mailer.GenerateCryptoKey(row.hash);
                const to = yield RSEngine_1.RSCrypto.Decrypt(row._to, key);
                const body = yield RSEngine_1.RSCrypto.Decrypt(row.body, key);
                yield mailer.Send(to, row.subject, body);
                yield conn.query('DELETE FROM mail_queue WHERE id = $1', [row.id]);
            }
            catch (e) {
                exports.logger.error(e);
                yield conn.query('UPDATE mail_queue SET attempts = attempts + 1 WHERE id = $1', [row.id]);
            }
        }
        catch (e) {
            exports.logger.error(e);
        }
        finally {
            conn.release();
        }
        yield sleep();
    }
}))();
//# sourceMappingURL=emails.js.map