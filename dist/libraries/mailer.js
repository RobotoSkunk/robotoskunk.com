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
exports.Mailer = void 0;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
class Mailer {
    constructor(options, logger, mode, root, pg, key) {
        this.mode = mode;
        this.logger = logger;
        this.options = options;
        this.root = root;
        this.pg = pg;
        this.key = key;
        if (mode === Mailer.Mode.Debug) {
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    const test = yield nodemailer_1.default.createTestAccount();
                    this.transporter = nodemailer_1.default.createTransport({
                        host: test.smtp.host,
                        port: test.smtp.port,
                        secure: test.smtp.secure,
                        auth: {
                            user: test.user,
                            pass: test.pass
                        }
                    });
                }
                catch (e) {
                    logger.error(e);
                }
            }))();
        }
        else if (mode === Mailer.Mode.Production)
            this.transporter = nodemailer_1.default.createTransport(options);
    }
    GenerateCryptoKey(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield RSEngine_1.RSCrypto.PBKDF2(this.key, hash, 1000, 32);
        });
    }
    Send(to, subject, body) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mode !== Mailer.Mode.Internal) {
                return this.transporter.sendMail({
                    from: this.options.auth.user,
                    to: to,
                    subject: subject,
                    html: yield this.MailBody(body, to)
                }, (err, info) => {
                    if (err)
                        return this.logger.error(err);
                    if (this.mode === Mailer.Mode.Debug)
                        this.logger.info(`LegacyEmail sent: ${nodemailer_1.default.getTestMessageUrl(info)}`);
                });
            }
            const conn = yield this.pg.connect();
            try {
                const id = crypto_1.default.randomBytes(16).toString('base64url');
                const hash = crypto_1.default.randomBytes(32).toString('hex');
                const key = yield this.GenerateCryptoKey(hash);
                const email = yield RSEngine_1.RSCrypto.Encrypt(to, key);
                const _body = yield RSEngine_1.RSCrypto.Encrypt(body, key);
                yield conn.query('INSERT INTO mail_queue (id, hash, _to, subject, body) VALUES ($1, $2, $3, $4, $5)', [id, hash, email, subject, _body]);
            }
            catch (e) {
                this.logger.error(e);
            }
            finally {
                conn.release();
            }
        });
    }
    MailBody(body, recipient) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield ejs_1.default.renderFile(path_1.default.join(process.cwd(), 'layouts/utils/mail.ejs'), {
                body,
                root: this.root,
                recipient
            })).replace(/[\t\n]/g, '');
        });
    }
}
exports.Mailer = Mailer;
(function (Mailer) {
    let Mode;
    (function (Mode) {
        Mode[Mode["Debug"] = 0] = "Debug";
        Mode[Mode["Internal"] = 1] = "Internal";
        Mode[Mode["Production"] = 2] = "Production";
    })(Mode = Mailer.Mode || (Mailer.Mode = {}));
})(Mailer = exports.Mailer || (exports.Mailer = {}));
//# sourceMappingURL=mailer.js.map