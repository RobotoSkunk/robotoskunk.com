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
exports.LegacyUser = exports.UserToken = exports.Token = exports.LegacyEmail = exports.mailer = exports.rtConn = exports.pgConn = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const promises_1 = __importDefault(require("dns/promises"));
const argon2_1 = __importDefault(require("argon2"));
const globals_1 = require("../globals");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const db_utils_1 = require("./db-utils");
const otpauth_1 = require("./otpauth");
const mailer_1 = require("./mailer");
const conn_1 = require("./conn");
Object.defineProperty(exports, "pgConn", { enumerable: true, get: function () { return conn_1.pgConn; } });
Object.defineProperty(exports, "rtConn", { enumerable: true, get: function () { return conn_1.rtConn; } });
exports.mailer = new mailer_1.Mailer({
    host: globals_1.env.emails.noreply.host,
    port: globals_1.env.emails.noreply.port,
    secure: globals_1.env.emails.noreply.secure,
    auth: {
        user: globals_1.env.emails.noreply.auth.user,
        pass: globals_1.env.emails.noreply.auth.pass
    }
}, globals_1.logger, globals_1.env.production ? mailer_1.Mailer.Mode.Internal : mailer_1.Mailer.Mode.Debug, globals_1.env.root, conn_1.pgConn, globals_1.env.keys.MASTER);
/**
 * @deprecated Use Email instead.
 */
class LegacyEmail {
    constructor(id, hash, email, userId, type, verified, createdAt, isFake) {
        this.id = id;
        this.hash = hash;
        this.email = email;
        this.userId = userId;
        this.type = type;
        this.verified = verified;
        this.createdAt = createdAt;
        this.isFake = isFake;
    }
    static GetById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query(`SELECT * FROM emails WHERE id = $1`, [id]);
                if (res.rowCount === 0)
                    return null;
                const row = res.rows[0];
                return new LegacyEmail(row.id, row.hash, row.email, row.usrid, row.refer, row.verified, row.created_at, row.is_fake);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    static Get(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query(`SELECT id FROM emails WHERE hash = $1`, [LegacyEmail.HMAC(email.toLowerCase())]);
                if (res.rowCount === 0)
                    return null;
                const row = res.rows[0];
                return yield LegacyEmail.GetById(row.id);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    /**
     * Gets an user object attached to an email
     * @returns The user object
     */
    GetUser() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const u = yield LegacyUser.GetById(this.userId);
                if (u)
                    return resolve(u);
                reject(new Error('LegacyUser not found'));
            }));
        });
    }
    /**
     * Checks if an email is valid.
     * @param email The email to check.
     * @returns True if the email is valid, false otherwise.
     */
    static Validate(email) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check syntax of email
            email = email.toLowerCase();
            if (email.length > 200)
                return false;
            if (!globals_1.regex.email.test(email))
                return false;
            const [user, domain] = email.split('@');
            // Check if user and domain are valid
            if (LegacyEmail.invalidNames.includes(user))
                return false;
            if (LegacyEmail.validDomains.includes(domain))
                return true;
            try {
                const readFile = util_1.default.promisify(fs_1.default.readFile);
                const data = (yield readFile(path_1.default.join(process.cwd(), 'disposable_email_blocklist.env'), 'ascii')).replace('\r\n', '\n');
                for (const line of data.split('\n'))
                    if (line === domain)
                        return true;
            }
            catch (_) { }
            const records = yield LegacyEmail.LookupMX(domain);
            if (records.length === 0)
                return false;
            return true;
        });
    }
    static LookupMX(domain) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield promises_1.default.resolveMx(domain);
            }
            catch (_) { }
            return [];
        });
    }
    static HMAC(email) { return RSEngine_1.RSCrypto.HMAC(email + globals_1.env.keys.SALT, globals_1.env.keys.HMAC); }
    static Exists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query(`SELECT id FROM emails WHERE hash = $1`, [LegacyEmail.HMAC(email.toLowerCase())]);
                return res.rowCount > 0;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    SetType(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query(`UPDATE emails SET refer = $1 WHERE id = $2`, [type, this.id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    static Set(email, key, uid, type = LegacyEmail.Type.PRIMARY) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = LegacyEmail.HMAC(email.toLowerCase());
            const enc = yield RSEngine_1.RSCrypto.Encrypt(email.toLowerCase(), key);
            const client = yield conn_1.pgConn.connect();
            try {
                if (!(yield LegacyUser.Exists(uid)))
                    return null;
                if (yield LegacyEmail.Exists(email))
                    return null;
                const res = yield client.query('INSERT INTO emails (hash, email, usrid, refer) VALUES ($1, $2, $3, $4) RETURNING id', [hash, enc, uid, type]);
                if (res.rowCount === 0)
                    return null;
                return LegacyEmail.GetById(res.rows[0].id);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    static SetFake(email, key, uid, type = LegacyEmail.Type.PRIMARY) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = LegacyEmail.HMAC(RSEngine_1.RSCrypto.RandomBytes(32));
            const enc = yield RSEngine_1.RSCrypto.Encrypt(email.toLowerCase(), key);
            const client = yield conn_1.pgConn.connect();
            try {
                if (!(yield LegacyUser.Exists(uid)))
                    return false;
                yield client.query('INSERT INTO emails (hash, email, usrid, refer, is_fake) VALUES ($1, $2, $3, $4, true)', [hash, enc, uid, type]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    Read(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT email FROM emails WHERE hash = $1', [this.hash]);
                if (res.rowCount === 0)
                    return null;
                return yield RSEngine_1.RSCrypto.Decrypt(res.rows[0].email, key);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    Send(type, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isFake)
                return yield RSEngine_1.RSRandom.Wait(50, 150);
            const conn = yield conn_1.pgConn.connect();
            function verifyLink(token) { return `${globals_1.env.root}/verify-email/${token}`; }
            const contactLink = `${globals_1.env.root}/contact`;
            try {
                var body, subject;
                switch (type) {
                    case LegacyEmail.MailType.NEW_USER: {
                        const id = RSEngine_1.RSCrypto.RandomBytes(16);
                        const validator = RSEngine_1.RSCrypto.RandomBytes(32);
                        const valHash = RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC);
                        yield conn.query('INSERT INTO verify_email_queue (id, val_key, eid) VALUES ($1, $2, $3)', [id, valHash, this.id]);
                        subject = 'Welcome to robotoskunk.com!';
                        body = `<h2>Verify your RobotoSkunk account.</h2>
						<p>Someone tried to create a RobotoSkunk account using this email. If it was you, confirm your email using the following link:
						<p><a href="${verifyLink(`${id}.${validator}`)}">${verifyLink(`${id}.${validator}`)}</a>

						<p>If it wasn't you, you can safely ignore this email. If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
                        break;
                    }
                    case LegacyEmail.MailType.VERIFY: {
                        if (this.verified)
                            return;
                        var token;
                        const res = yield conn.query('SELECT id FROM verify_email_queue WHERE eid = $1', [this.id]);
                        if (res.rowCount === 0) {
                            const id = RSEngine_1.RSCrypto.RandomBytes(16);
                            const validator = RSEngine_1.RSCrypto.RandomBytes(32);
                            const valHash = RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC);
                            yield conn.query('INSERT INTO verify_email_queue (id, val_key, eid) VALUES ($1, $2, $3)', [id, valHash, this.id]);
                            token = `${id}.${validator}`;
                        }
                        else {
                            const validator = RSEngine_1.RSCrypto.RandomBytes(32);
                            const valHash = RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC);
                            yield conn.query('UPDATE verify_email_queue SET val_key = $1 WHERE eid = $2', [valHash, this.id]);
                            token = `${res.rows[0].id}.${validator}`;
                        }
                        subject = 'Verify your email address';
                        body = `<h2>Verify your email address.</h2>
						<p>Someone sent you an email verification request. If it was you, confirm your email using the following link:
						<p><a href="${verifyLink(token)}">${verifyLink(token)}</a>

						<p>If it wasn't you, you can safely ignore this email. If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
                        break;
                    }
                    case LegacyEmail.MailType.PASSWORD_RESET_REQUEST: {
                        if (!this.verified || this.type !== LegacyEmail.Type.PRIMARY)
                            return;
                        var token;
                        const res = yield conn.query(`SELECT id FROM password_resets WHERE usrid = $1`, [this.userId]);
                        if (res.rowCount === 0) {
                            const id = RSEngine_1.RSCrypto.RandomBytes(16);
                            const validator = RSEngine_1.RSCrypto.RandomBytes(32);
                            const valHash = RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC);
                            yield conn.query('INSERT INTO password_resets (id, val_key, usrid) VALUES ($1, $2, $3)', [id, valHash, this.userId]);
                            token = `${id}.${validator}`;
                        }
                        else {
                            const validator = RSEngine_1.RSCrypto.RandomBytes(32);
                            const valHash = RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC);
                            yield conn.query('UPDATE password_resets SET val_key = $1 WHERE usrid = $2', [valHash, this.userId]);
                            token = `${res.rows[0].id}.${validator}`;
                        }
                        subject = 'Reset your password';
                        body = `<h2>Reset your password.</h2>
						<p>Someone has requested a password reset for your account. If it was you, reset your password using the following link:

						<p><a href="${globals_1.env.root}/accounts/change-password?token=${token}">${globals_1.env.root}/accounts/change-password?token=${token}</a>

						<p>If it wasn't you, someone else may be trying to access your account. You should change your password immediately.
						<p>If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
                        break;
                    }
                    case LegacyEmail.MailType.PASSWORD_RESET: {
                        subject = 'Your password has been reset';
                        body = `<h2>Your password has been reset.</h2>
						<p>Your password has been reset. If you did request this, you can now log in with your new password.
						
						<p>If you did not request this, please contact us at <a href="${contactLink}">${contactLink}</a> immediately.`;
                        break;
                    }
                    case LegacyEmail.MailType.ACCOUNT_DELETION: {
                        subject = 'Someone has requested to delete your account';
                        body = `<h2>Someone has requested to delete your account.</h2>
						<p>Someone has requested to delete your account. If it was you, you shouldn't need to do anything. Your account will be deleted in 7 days.

						<p>If it wasn't you, you can cancel the deletion request by logging in and going to your account settings.

						<p>If you have any questions, please contact us at <a href="${contactLink}">${contactLink}</a>.`;
                        break;
                    }
                }
                const user = yield this.GetUser();
                const realEmail = yield this.Read(yield user.GetCryptoKey());
                yield exports.mailer.Send(realEmail, subject, body);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                conn.release();
            }
        });
    }
    Delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield conn_1.pgConn.connect();
            try {
                if (this.type === LegacyEmail.Type.PRIMARY)
                    return false;
                yield conn.query('DELETE FROM emails WHERE hash = $1', [this.hash]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                conn.release();
            }
            return false;
        });
    }
    static Verify(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield conn_1.pgConn.connect();
            try {
                if (!Token.TokenFormat(token))
                    return false;
                const [id, validator] = token.split('.');
                const valHash = RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC);
                const res = yield conn.query('SELECT eid, val_key FROM verify_email_queue WHERE id = $1', [id]);
                if (res.rowCount === 0)
                    return false;
                if (!RSEngine_1.RSCrypto.Compare(valHash, res.rows[0].val_key))
                    return false;
                yield conn.query('DELETE FROM verify_email_queue WHERE id = $1', [id]);
                yield conn.query('UPDATE emails SET verified = true WHERE id = $1', [res.rows[0].eid]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                conn.release();
            }
            return false;
        });
    }
}
exports.LegacyEmail = LegacyEmail;
(function (LegacyEmail) {
    let Type;
    (function (Type) {
        Type[Type["PRIMARY"] = 0] = "PRIMARY";
        Type[Type["CONTACT"] = 1] = "CONTACT";
        Type[Type["SECONDARY"] = 2] = "SECONDARY";
    })(Type = LegacyEmail.Type || (LegacyEmail.Type = {}));
    let MailType;
    (function (MailType) {
        MailType[MailType["NEW_USER"] = 0] = "NEW_USER";
        MailType[MailType["VERIFY"] = 1] = "VERIFY";
        MailType[MailType["PASSWORD_RESET_REQUEST"] = 2] = "PASSWORD_RESET_REQUEST";
        MailType[MailType["PASSWORD_RESET"] = 3] = "PASSWORD_RESET";
        MailType[MailType["ACCOUNT_DELETION"] = 4] = "ACCOUNT_DELETION";
    })(MailType = LegacyEmail.MailType || (LegacyEmail.MailType = {}));
    LegacyEmail.validDomains = [
        'live.com.mx', 'gmail.com', 'yahoo.com', 'hotmail.com', 'aol.com', 'hotmail.co.uk', 'hotmail.fr',
        'msn.com', 'yahoo.fr', 'wanadoo.fr', 'orange.fr', 'comcast.net', 'yahoo.co.uk',
        'yahoo.com.br', 'yahoo.co.in', 'live.com', 'rediffmail.com', 'free.fr', 'gmx.de',
        'web.de', 'yandex.ru', 'ymail.com', 'libero.it', 'outlook.com', 'uol.com.br',
        'bol.com.br', 'mail.ru', 'cox.net', 'hotmail.it', 'sbcglobal.net', 'sfr.fr',
        'live.fr', 'verizon.net', 'live.co.uk', 'googlemail.com', 'yahoo.es', 'ig.com.br',
        'live.nl', 'bigpond.com', 'terra.com.br', 'yahoo.it', 'neuf.fr', 'yahoo.de',
        'alice.it', 'rocketmail.com', 'att.net', 'laposte.net', 'facebook.com', 'bellsouth.net',
        'yahoo.in', 'hotmail.es', 'charter.net', 'yahoo.ca', 'yahoo.com.au', 'rambler.ru',
        'hotmail.de', 'tiscali.i', 'shaw.c', 'yahoo.co.j', 'sky.co', 'earthlink.net', 'optonline.net',
        'freenet.de', 't-online.de', 'aliceadsl.fr', 'virgilio.it', 'home.nl', 'qq.com', 'telenet.be',
        'me.com', 'yahoo.com.ar', 'tiscali.co.uk', 'yahoo.com.mx', 'voila.fr', 'gmx.net', 'mail.com',
        'planet.nl', 'tin.it', 'live.it', 'ntlworld.com', 'arcor.de', 'yahoo.co.id', 'frontiernet.net',
        'hetnet.nl', 'live.com.au', 'yahoo.com.sg', 'zonnet.nl', 'club-internet.fr', 'juno.com',
        'optusnet.com.au', 'blueyonder.co.uk', 'bluewin.ch', 'skynet.be', 'sympatico.ca',
        'windstream.net', 'mac.com', 'centurytel.net', 'chello.nl', 'live.ca', 'aim.com', 'bigpond.net.au',
        'robotoskunk.com', 'microsoft.com', 'google.com', 'goddady.com'
    ];
    LegacyEmail.invalidNames = [
        'noreply', 'no-reply', 'support', 'example', 'info', 'user', 'mail', 'test', 'noreply-dominos',
        'microsoftstore', 'news', 'email', 'notification', 'purchases', 'purchase', 'notifications',
        'noreply-purchases', 'message', 'messages', 'no-responder', 'dominospizzamx', 'friendupdates',
        'mailer', 'reply'
    ];
})(LegacyEmail = exports.LegacyEmail || (exports.LegacyEmail = {}));
class Token {
    constructor(id, validator, createdAt, expiresAt) {
        this.id = id;
        this.validator = validator;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }
    static TokenFormat(token) { return token.split('.').filter(Boolean).length === 2; }
    static HMAC(secret) { return RSEngine_1.RSCrypto.HMAC(secret, globals_1.env.keys.HMAC); }
    Validate(validator) {
        return __awaiter(this, void 0, void 0, function* () { return RSEngine_1.RSCrypto.Compare(this.validator, Token.HMAC(validator)); });
    }
}
exports.Token = Token;
class UserToken extends Token {
    constructor(id, validator, createdAt, expiresAt, client, usrid, lastUsage, lastUpdate, is_tmp, verified) {
        super(id, validator, createdAt, expiresAt);
        this.client = client;
        this.usrid = usrid;
        this.lastUsage = lastUsage;
        this.lastUpdate = lastUpdate;
        this.is_tmp = is_tmp;
        this.verified = verified;
    }
    GetUser() {
        return __awaiter(this, void 0, void 0, function* () { return yield LegacyUser.GetById(this.usrid); });
    }
    static Set(uid, remember, useragent, verified) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const id = RSEngine_1.RSCrypto.RandomBytes(16);
                const validator = RSEngine_1.RSCrypto.RandomBytes(32);
                const browser = RSEngine_1.RSUtils.AnonymizeAgent(useragent);
                const _res = yield client.query(`INSERT INTO auth_tokens (id, usrid, client, val_key, is_temp, expires_at, verified) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + INTERVAL '1 ${remember ? 'WEEK' : 'HOUR'}', $6) RETURNING created_at, expires_at, last_usage, last_update`, [
                    id,
                    uid,
                    browser,
                    RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC),
                    !remember,
                    verified
                ]);
                return {
                    token: new UserToken(id, RSEngine_1.RSCrypto.HMAC(validator, globals_1.env.keys.HMAC), _res.rows[0].created_at, _res.rows[0].expires_at, browser, uid, _res.rows[0].last_usage, _res.rows[0].lastUpdate, !remember, verified),
                    text: `${id}.${validator}`
                };
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    static Get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT * FROM auth_tokens WHERE id = $1;`, [id]);
                if (_res.rows.length === 0)
                    return null;
                const token = _res.rows[0];
                return new UserToken(token.id, token.val_key, token.created_at, token.expires_at, token.client, token.usrid, token.last_usage, token.last_update, token.is_temp, token.verified);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    static Auth(token, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Token.TokenFormat(token))
                return null;
            const [id, validator] = token.split('.');
            const tok = yield UserToken.Get(id);
            if (!tok)
                return null;
            if (yield tok.Validate(validator)) {
                if (!tok.verified)
                    return null;
                const client = yield conn_1.pgConn.connect();
                try {
                    const _tmp = yield client.query(`UPDATE auth_tokens SET last_usage = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL '1 ${tok.is_tmp ? 'HOUR' : 'WEEK'}' WHERE id = $1 RETURNING last_usage, expires_at`, [id]);
                    tok.lastUsage = _tmp.rows[0].last_usage;
                    tok.expiresAt = _tmp.rows[0].expires_at;
                    var updated = false;
                    var __validator = validator;
                    if (tok.lastUpdate.getTime() < Date.now() - RSEngine_1.RSTime._HOUR_) {
                        const newValidator = RSEngine_1.RSCrypto.RandomBytes(32);
                        yield client.query(`UPDATE auth_tokens SET val_key = $1, last_update = CURRENT_TIMESTAMP, client = $2 WHERE id = $3`, [
                            Token.HMAC(newValidator),
                            RSEngine_1.RSUtils.AnonymizeAgent(userAgent),
                            id
                        ]);
                        tok.validator = Token.HMAC(newValidator);
                        __validator = newValidator;
                        updated = true;
                    }
                    return {
                        token: tok,
                        text: `${tok.id}.${__validator}`,
                        updated: updated
                    };
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
                finally {
                    client.release();
                }
            }
            return null;
        });
    }
    static SimpleAuth(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Token.TokenFormat(token))
                return null;
            const [id, validator] = token.split('.');
            const tok = yield UserToken.Get(id);
            if (!tok)
                return null;
            return (yield tok.Validate(validator)) ? tok : null;
        });
    }
    TwoFactorAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query(`UPDATE auth_tokens SET verified = true WHERE id = $1`, [this.id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    GetCookieParams(isOnion) {
        return {
            expires: this.is_tmp ? undefined : new Date(Date.now() + RSEngine_1.RSTime._YEAR_ * 10),
            path: '/',
            secure: globals_1.env.production && !isOnion,
            httpOnly: true,
            sameSite: 'lax',
            domain: isOnion ? undefined : (globals_1.env.production ? `.${globals_1.env.domain}` : 'localhost')
        };
    }
    Destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query(`DELETE FROM auth_tokens WHERE id = $1`, [this.id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    GenerateCSRF() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            const csrf = RSEngine_1.RSCrypto.RandomBytes(32);
            try {
                yield client.query(`UPDATE auth_tokens SET _csrf = $1 WHERE id = $2`, [RSEngine_1.RSCrypto.HMAC(csrf, globals_1.env.keys.HMAC), this.id]);
                return csrf;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return csrf;
        });
    }
    ValidateCSRF(csrf) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT _csrf FROM auth_tokens WHERE id = $1`, [this.id]);
                return RSEngine_1.RSCrypto.Compare(_res.rows[0]._csrf, RSEngine_1.RSCrypto.HMAC(csrf, globals_1.env.keys.HMAC));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GenerateConfigAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            const auth = RSEngine_1.RSCrypto.RandomBytes(32);
            try {
                yield client.query(`UPDATE auth_tokens SET _config_auth = $1 WHERE id = $2`, [RSEngine_1.RSCrypto.HMAC(auth, globals_1.env.keys.HMAC), this.id]);
                return auth;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return auth;
        });
    }
    ValidateConfigAuth(auth) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT _config_auth FROM auth_tokens WHERE id = $1`, [this.id]);
                return RSEngine_1.RSCrypto.Compare(_res.rows[0]._config_auth, RSEngine_1.RSCrypto.HMAC(auth, globals_1.env.keys.HMAC));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GetAllByUser() {
        return __asyncGenerator(this, arguments, function* GetAllByUser_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const _res = yield __await(client.query(`SELECT id FROM auth_tokens WHERE usrid = $1 ORDER BY created_at DESC`, [this.usrid]));
                for (const row of _res.rows) {
                    const tok = yield __await(UserToken.Get(row.id));
                    if (tok !== null)
                        yield yield __await(tok);
                }
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
}
exports.UserToken = UserToken;
/**
 * @deprecated Use User instead.
 */
class LegacyUser {
    constructor(id, hash, name, handler, birthdate, roles) {
        this.id = id;
        this.hash = hash;
        this.name = name;
        this.handler = handler;
        this.birthdate = birthdate;
        this.roles = roles;
    }
    get url() { return `/user/${this.handler}`; }
    get avatar() { return `/avatar/default.webp`; }
    // #region Security management
    static GenerateCryptoKey(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield RSEngine_1.RSCrypto.PBKDF2(globals_1.env.keys.MASTER, hash, 1000, 32);
        });
    }
    GetCryptoKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield LegacyUser.GenerateCryptoKey(this.hash);
        });
    }
    // #endregion
    // #region LegacyUser management
    static Auth(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = { code: LegacyUser.Code.INTERNAL_ERROR };
            const client = yield conn_1.pgConn.connect();
            yield RSEngine_1.RSRandom.Wait(0, 150);
            try {
                const emailObj = yield LegacyEmail.Get(email);
                if (!emailObj) {
                    response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD;
                    return response;
                }
                if (emailObj.type != LegacyEmail.Type.PRIMARY) {
                    response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD;
                    return response;
                }
                const res = yield client.query('SELECT id, password, totp_secret, totp_enabled FROM users WHERE id = $1', [emailObj.userId]);
                const passHash = res.rows[0].password;
                if (passHash.startsWith('$2')) {
                    if (!(yield bcrypt_1.default.compare(password, passHash))) {
                        response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD;
                        return response;
                    }
                    const newPass = yield argon2_1.default.hash(password);
                    yield client.query('UPDATE users SET password = $1 WHERE id = $2', [newPass, emailObj.userId]);
                }
                else {
                    if (!(yield argon2_1.default.verify(passHash, password))) {
                        response.code = LegacyUser.Code.INVALID_EMAIL_OR_PASSWORD;
                        return response;
                    }
                    if (argon2_1.default.needsRehash(passHash)) {
                        const newPass = yield argon2_1.default.hash(password);
                        yield client.query('UPDATE users SET password = $1 WHERE id = $2', [newPass, emailObj.userId]);
                    }
                }
                response.code = LegacyUser.Code.SUCCESS;
                response.user = yield LegacyUser.GetById(res.rows[0].id);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return response;
        });
    }
    static Set(username, email, password, birthdate) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = LegacyUser.Code.INTERNAL_ERROR;
            const client = yield conn_1.pgConn.connect();
            try {
                if (!RSEngine_1.RSTime.MinimumAge(birthdate))
                    return LegacyUser.Code.MINOR;
                if (yield LegacyUser.ExistsByHandler(username))
                    return LegacyUser.Code.ALREADY_EXISTS;
                const hash = crypto_1.default.randomBytes(32).toString('hex');
                const pwrd = yield argon2_1.default.hash(password);
                const res = yield client.query('INSERT INTO users (hash, username, _handler, password, birthdate) VALUES ($1, $2, $3, $4, $5) RETURNING id', [hash, username, username, pwrd, birthdate]);
                const _email = yield LegacyEmail.Set(email, yield LegacyUser.GenerateCryptoKey(hash), res.rows[0].id);
                if (!_email)
                    return LegacyUser.Code.INTERNAL_ERROR;
                _email.Send(LegacyEmail.MailType.NEW_USER);
                return LegacyUser.Code.SUCCESS;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return response;
        });
    }
    static GetById(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id, hash, username, _handler, birthdate, roles FROM users WHERE id = $1', [uid]);
                if (res.rowCount === 0)
                    return null;
                const user = res.rows[0];
                return new LegacyUser(user.id, user.hash, user.username, user._handler, user.birthdate, new db_utils_1.UserRoles(user.roles));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    static GetByHandler(handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id FROM users WHERE LOWER(_handler) = LOWER($1)', [handler]);
                if (res.rowCount === 0)
                    return null;
                return yield LegacyUser.GetById(res.rows[0].id);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    static Exists(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id FROM users WHERE id = $1', [id]);
                return res.rowCount > 0;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    static ExistsByHandler(handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id FROM users WHERE LOWER(_handler) = LOWER($1)', [handler]);
                return res.rowCount > 0;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GetDeleteDate() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT end_date FROM users WHERE id = $1', [this.id]);
                return res.rows[0].end_date;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    Delete(password, aprove) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                if (!(yield this.VerifyPassword(password)))
                    return false;
                if (aprove)
                    yield client.query(`UPDATE users SET end_date = CURRENT_TIMESTAMP + INTERVAL '1 WEEK' WHERE id = $1`, [this.id]);
                else
                    yield client.query(`UPDATE users SET end_date = NULL WHERE id = $1`, [this.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    VerifyPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT password FROM users WHERE id = $1', [this.id]);
                return yield argon2_1.default.verify(res.rows[0].password, password);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    ChangePassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const pwrd = yield argon2_1.default.hash(password);
                yield client.query('UPDATE users SET password = $1 WHERE id = $2', [pwrd, this.id]);
                yield client.query('DELETE FROM auth_tokens WHERE usrid = $1', [this.id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    GetEmails() {
        return __asyncGenerator(this, arguments, function* GetEmails_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const res = yield __await(client.query('SELECT id FROM emails WHERE usrid = $1 ORDER BY refer ASC', [this.id]));
                for (const row of res.rows)
                    yield yield __await(yield __await(LegacyEmail.GetById(row.id)));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return yield __await([]);
        });
    }
    GetEmailsCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT COUNT(1) FROM emails WHERE usrid = $1', [this.id]);
                return res.rows[0].count;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return 0;
        });
    }
    SetPrimaryEmail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query('UPDATE emails SET refer = $1 WHERE usrid = $2 AND refer = $3', [LegacyEmail.Type.SECONDARY, this.id, LegacyEmail.Type.PRIMARY]);
                yield client.query('UPDATE emails SET refer = $1 WHERE id = $2', [LegacyEmail.Type.PRIMARY, id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    SetContactEmail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query('UPDATE emails SET refer = $1 WHERE usrid = $2 AND refer = $3', [LegacyEmail.Type.SECONDARY, this.id, LegacyEmail.Type.CONTACT]);
                yield client.query('UPDATE emails SET refer = $1 WHERE id = $2', [LegacyEmail.Type.CONTACT, id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    UnsetContactEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query('UPDATE emails SET refer = $1 WHERE usrid = $2 AND refer = $3', [LegacyEmail.Type.SECONDARY, this.id, LegacyEmail.Type.CONTACT]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    GetPrimaryEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id FROM emails WHERE usrid = $1 AND refer = $2', [this.id, LegacyEmail.Type.PRIMARY]);
                return yield LegacyEmail.GetById(res.rows[0].id);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    GetContactEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id FROM emails WHERE usrid = $1 AND refer = $2', [this.id, LegacyEmail.Type.CONTACT]);
                if (res.rowCount > 0)
                    return yield LegacyEmail.GetById(res.rows[0].id);
                return null;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    CheckBlacklist() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT _type FROM blacklist WHERE usrid = $1', [this.id]);
                var flags = 0;
                for (const row of res.rows)
                    flags |= row._type;
                return flags;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return db_utils_1.Blacklist.FLAGS.NONE;
        });
    }
    CheckSpecificBlacklist(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT * FROM blacklist WHERE usrid = $1 AND _type = $2', [this.id, type]);
                if (res.rowCount > 0)
                    return res.rows[0];
                return null;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    // #endregion
    // #region Security
    Enabled2FA() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT totp_enabled FROM users WHERE id = $1', [this.id]);
                return res.rows[0].totp_enabled;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    Verify2FA(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT totp_secret FROM users WHERE id = $1', [this.id]);
                const secret = yield RSEngine_1.RSCrypto.Decrypt(res.rows[0].totp_secret, yield this.GetCryptoKey());
                const totp = new otpauth_1.OTPAuth(secret);
                return yield totp.check(code);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    Set2FA() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT totp_secret FROM users WHERE id = $1', [this.id]);
                if (res.rows[0].totp_secret)
                    return;
                const secret = yield RSEngine_1.RSCrypto.Encrypt(yield otpauth_1.OTPAuth.genSecret(), yield this.GetCryptoKey());
                yield client.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, this.id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    Enable2FA() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query('UPDATE users SET totp_enabled = true WHERE id = $1', [this.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    Disable2FA() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query('UPDATE users SET totp_enabled = false, totp_secret = null WHERE id = $1', [this.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GetTOTPSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT totp_secret FROM users WHERE id = $1', [this.id]);
                const secret = yield RSEngine_1.RSCrypto.Decrypt(res.rows[0].totp_secret, yield this.GetCryptoKey());
                return new otpauth_1.OTPAuth(secret, '@' + this.handler);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    GenerateRecoveryCodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const codes = [], hashes = [];
                for (var i = 0; i < 3; i++) {
                    const code = RSEngine_1.RSCrypto.RandomBytes(8);
                    codes.push(code);
                    hashes.push(RSEngine_1.RSCrypto.HMAC(code, globals_1.env.keys.HMAC));
                }
                yield client.query('UPDATE users SET totp_recovery = $1 WHERE id = $2', [`{${hashes.join(',')}}`, this.id]);
                return codes;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return null;
        });
    }
    VerifyRecoveryCode(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT totp_recovery FROM users WHERE id = $1', [this.id]);
                const codes = res.rows[0].totp_recovery;
                const c = RSEngine_1.RSCrypto.HMAC(code, globals_1.env.keys.HMAC);
                var found = false;
                for (var i = 0; i < codes.length; i++) {
                    if (RSEngine_1.RSCrypto.Compare(codes[i], c)) {
                        found = true;
                        codes.splice(i, 1);
                    }
                }
                if (found)
                    yield client.query('UPDATE users SET totp_recovery = $1 WHERE id = $2', [`{${codes.join(',')}}`, this.id]);
                return found;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    DestroyRecoveryCodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query('UPDATE users SET totp_recovery = null WHERE id = $1', [this.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GetRecoveryCodesCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT totp_recovery FROM users WHERE id = $1', [this.id]);
                const codes = res.rows[0].totp_recovery;
                return codes.length;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return 0;
        });
    }
    // #endregion
    // #region LegacyUser interactions
    //  #region Following
    AddFollow(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                if (this.id === user.id)
                    return false;
                if (yield this.IsFollowing(user))
                    return false;
                if (yield this.HasBlocked(user))
                    return false;
                yield client.query('INSERT INTO follow_list (author, victim) VALUES ($1, $2)', [this.id, user.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    RemoveFollow(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                if (this.id === user.id)
                    return false;
                if (!(yield this.IsFollowing(user)))
                    return false;
                yield client.query('DELETE FROM follow_list WHERE author = $1 AND victim = $2', [this.id, user.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    IsFollowing(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT 1 FROM follow_list WHERE author = $1 AND victim = $2', [this.id, user.id]);
                return res.rowCount > 0;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GetFollowing() {
        return __asyncGenerator(this, arguments, function* GetFollowing_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const res = yield __await(client.query('SELECT author FROM follow_list WHERE victim = $1', [this.id]));
                for (const row of res.rows)
                    yield yield __await(yield __await(LegacyUser.GetById(row.author)));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    GetFollowingCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT COUNT(1) FROM follow_list WHERE victim = $1', [this.id]);
                return res.rows[0].count;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return 0;
        });
    }
    //  #endregion
    //  #region Blocked
    HasBlocked(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT 1 FROM block_list WHERE author = $1 AND victim = $2', [this.id, user.id]);
                return res.rowCount > 0;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    BlockUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                if (this.id === user.id)
                    return false;
                if (yield this.HasBlocked(user))
                    return false;
                yield client.query('INSERT INTO block_list (author, victim) VALUES ($1, $2)', [this.id, user.id]);
                yield this.RemoveFollow(user);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    UnblockUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                if (this.id === user.id)
                    return false;
                if (!(yield this.HasBlocked(user)))
                    return false;
                yield client.query('DELETE FROM block_list WHERE author = $1 AND victim = $2', [this.id, user.id]);
                return true;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return false;
        });
    }
    GetBlocked() {
        return __asyncGenerator(this, arguments, function* GetBlocked_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const res = yield __await(client.query('SELECT victim FROM block_list WHERE author = $1', [this.id]));
                for (const row of res.rows)
                    yield yield __await(yield __await(LegacyUser.GetById(row.victim)));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    GetBlockedCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT COUNT(1) FROM block_list WHERE author = $1', [this.id]);
                return res.rows[0].count;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return 0;
        });
    }
    //  #endregion
    //  #region Mentions
    static HandlerToInstance(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const mentions = msg.match(/@([a-zA-Z0-9_-]+)/gm);
            if (mentions) {
                for (const mention of mentions) {
                    const user = yield LegacyUser.GetByHandler(mention.slice(1));
                    if (user)
                        msg = msg.replace(mention, `<@${user.id}>`);
                    else
                        msg = msg.replace(mention, `\\@${mention.slice(1)}`);
                }
            }
            return msg;
        });
    }
    static InstanceToHandler(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            // ID formats are in UUID
            const mentions = msg.match(/<@([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})>/gm);
            if (mentions) {
                for (const mention of mentions) {
                    const user = yield LegacyUser.GetById(mention.slice(2, -1));
                    if (user)
                        msg = msg.replace(mention, `@${user.handler}`);
                    else
                        msg = msg.replace(mention, '\\@deleted-user');
                }
            }
            return msg;
        });
    }
    // #endregion
    // #endregion
    LoadFullData() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT created_at, bio, end_date FROM users WHERE id = $1', [this.id]);
                if (res.rowCount === 0)
                    return;
                const user = res.rows[0];
                this.bio = user.bio;
                this.createdAt = user.created_at;
                this.endDate = user.end_date;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
}
exports.LegacyUser = LegacyUser;
(function (LegacyUser) {
    let Code;
    (function (Code) {
        Code[Code["SUCCESS"] = 0] = "SUCCESS";
        Code[Code["INTERNAL_ERROR"] = 1] = "INTERNAL_ERROR";
        Code[Code["INVALID_EMAIL_OR_PASSWORD"] = 2] = "INVALID_EMAIL_OR_PASSWORD";
        // REQUIRE_2FA =               1 << 2,
        // INVALID_2FA =               1 << 3,
        Code[Code["ALREADY_EXISTS"] = 16] = "ALREADY_EXISTS";
        Code[Code["MINOR"] = 32] = "MINOR";
    })(Code = LegacyUser.Code || (LegacyUser.Code = {}));
})(LegacyUser = exports.LegacyUser || (exports.LegacyUser = {}));
//# sourceMappingURL=db-esentials.js.map