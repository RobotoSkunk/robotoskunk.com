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
exports.Commissions = exports.Config = exports.UserAuditLog = exports.PasswordToken = exports.Shout = exports.mailer = exports.UserToken = exports.Token = exports.Email = exports.User = exports.rtConn = exports.pgConn = void 0;
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const globals_1 = require("../globals");
const RSEngine_1 = require("../libs/RSEngine");
const rateLimiter_1 = require("./rateLimiter");
const conn_1 = require("./conn");
Object.defineProperty(exports, "pgConn", { enumerable: true, get: function () { return conn_1.pgConn; } });
Object.defineProperty(exports, "rtConn", { enumerable: true, get: function () { return conn_1.rtConn; } });
const db_esentials_1 = require("./db-esentials");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return db_esentials_1.User; } });
Object.defineProperty(exports, "Email", { enumerable: true, get: function () { return db_esentials_1.Email; } });
Object.defineProperty(exports, "Token", { enumerable: true, get: function () { return db_esentials_1.Token; } });
Object.defineProperty(exports, "UserToken", { enumerable: true, get: function () { return db_esentials_1.UserToken; } });
Object.defineProperty(exports, "mailer", { enumerable: true, get: function () { return db_esentials_1.mailer; } });
class Shout {
    constructor(id, author, victim, content, createdAt, editedAt) {
        this.id = id;
        this.author = author;
        this.victim = victim;
        this.content = content;
        this.createdAt = createdAt;
        this.editedAt = editedAt;
    }
    static LengthIsValid(cont) {
        cont = cont.trim();
        return cont.length > 0 && cont.length <= 250;
    }
    static Parse(content) {
        return __awaiter(this, void 0, void 0, function* () {
            content = content.trim();
            content = yield db_esentials_1.User.HandlerToInstance(content);
            return content;
        });
    }
    static Unparse(content) {
        return __awaiter(this, void 0, void 0, function* () {
            content = yield db_esentials_1.User.InstanceToHandler(content);
            return content;
        });
    }
    GetEdits() {
        return __asyncGenerator(this, arguments, function* GetEdits_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const _res = yield __await(client.query(`SELECT cont, created_at FROM shout_edit_history WHERE shout = $1 ORDER BY created_at DESC`, [this.id]));
                for (const row of _res.rows) {
                    yield yield __await({
                        content: row.cont,
                        createdAt: row.created_at
                    });
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
    GetAuthor() {
        return __awaiter(this, void 0, void 0, function* () { return yield db_esentials_1.User.GetById(this.author); });
    }
    static Create(author, victim, content, onRateLimiting) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Shout.LengthIsValid(content))
                return Shout.Code.INVALID_LENGTH;
            try {
                yield rateLimiter_1.__commentLimiter.consume(`user:${author}:shout:${victim}`);
            }
            catch (e) {
                if (!(e instanceof Error))
                    onRateLimiting(e);
                return Shout.Code.RATE_LIMITED;
            }
            const client = yield conn_1.pgConn.connect();
            content = yield Shout.Parse(content);
            try {
                const _res = yield client.query(`INSERT INTO shouts (author, victim, cont) VALUES ($1, $2, $3) RETURNING id`, [author, victim, content]);
                if (_res.rows.length === 0)
                    return Shout.Code.INTERNAL_ERROR;
                return Shout.Code.SUCCESS;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return Shout.Code.INTERNAL_ERROR;
        });
    }
    static GetById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT * FROM shouts WHERE id = $1`, [id]);
                if (_res.rows.length === 0)
                    return null;
                const shout = _res.rows[0];
                return new Shout(shout.id, shout.author, shout.victim, yield Shout.Unparse(shout.cont), shout.created_at, shout.edited_at);
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
    static GetByVictim(victim, page) {
        return __asyncGenerator(this, arguments, function* GetByVictim_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const _res = yield __await(client.query(`SELECT * FROM shouts WHERE victim = $1 ORDER BY created_at DESC LIMIT 10 OFFSET $2`, [victim, page * 10]));
                for (const row of _res.rows)
                    yield yield __await(new Shout(row.id, row.author, row.victim, yield __await(Shout.Unparse(row.cont)), row.created_at, row.edited_at));
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    static GetByVictimCount(author) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT COUNT(1) FROM shouts WHERE victim = $1`, [author]);
                return _res.rows[0].count;
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
    Update(author, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Shout.LengthIsValid(content))
                return Shout.Code.INVALID_LENGTH;
            if (this.author !== author)
                return Shout.Code.NOT_ALLOWED;
            const client = yield conn_1.pgConn.connect();
            content = yield Shout.Parse(content);
            try {
                const _res = yield client.query(`SELECT COUNT(1) FROM shout_edit_history WHERE shout = $1`, [this.id]);
                if (_res.rows[0].count >= 5)
                    return Shout.Code.MAXIMUM_EDITS;
                yield client.query(`UPDATE shouts SET cont = $1, edited_at = CURRENT_TIMESTAMP WHERE id = $2`, [content, this.id]);
                yield client.query(`INSERT INTO shout_edit_history (shout, cont) VALUES ($1, $2)`, [this.id, this.content]);
                this.content = content;
                this.editedAt = new Date();
                return Shout.Code.SUCCESS;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return Shout.Code.INTERNAL_ERROR;
        });
    }
    Delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query(`DELETE FROM shouts WHERE id = $1`, [this.id]);
                return Shout.Code.SUCCESS;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return Shout.Code.INTERNAL_ERROR;
        });
    }
}
exports.Shout = Shout;
(function (Shout) {
    let Code;
    (function (Code) {
        Code[Code["SUCCESS"] = 0] = "SUCCESS";
        Code[Code["INTERNAL_ERROR"] = 1] = "INTERNAL_ERROR";
        Code[Code["NOT_ALLOWED"] = 2] = "NOT_ALLOWED";
        Code[Code["INVALID_LENGTH"] = 3] = "INVALID_LENGTH";
        Code[Code["MAXIMUM_EDITS"] = 4] = "MAXIMUM_EDITS";
        Code[Code["RATE_LIMITED"] = 5] = "RATE_LIMITED";
    })(Code = Shout.Code || (Shout.Code = {}));
})(Shout || (exports.Shout = Shout = {}));
class PasswordToken extends db_esentials_1.Token {
    constructor(id, validator, createdAt, expiresAt, uid) {
        super(id, validator, createdAt, expiresAt);
        this.uid = uid;
    }
    static Get(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!db_esentials_1.Token.TokenFormat(token))
                return null;
            const [id, _] = token.split('.');
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT * FROM password_resets WHERE id = $1`, [id]);
                if (_res.rows.length === 0)
                    return null;
                const token = _res.rows[0];
                return new PasswordToken(token.id, token.val_key, token.created_at, token.expires_at, token.usrid);
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
    Authorize(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!db_esentials_1.Token.TokenFormat(token))
                return false;
            const [_, validator] = token.split('.');
            const tok = yield PasswordToken.Get(token);
            if (!tok)
                return false;
            return yield tok.Validate(validator);
        });
    }
    Delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                yield client.query(`DELETE FROM password_resets WHERE id = $1`, [this.id]);
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    ToString() { return `${this.id}.${this.validator}`; }
}
exports.PasswordToken = PasswordToken;
class UserAuditLog {
    constructor(uid, userAgent, type, relevance, createdAt, destroysAt, data) {
        this.uid = uid;
        this.userAgent = userAgent;
        this.type = type;
        this.relevance = relevance;
        this.data = data;
        this.createdAt = createdAt;
        this.destroysAt = destroysAt;
    }
    static FetchPage(uid, page, filters = UserAuditLog.Relevance.ANY) {
        return __asyncGenerator(this, arguments, function* FetchPage_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const _res = yield __await(client.query(`SELECT * FROM user_audit_log WHERE _uid = $1 AND _relevance & $2 != 0 ORDER BY created_at DESC LIMIT 10 OFFSET $3`, [uid, filters, page * 10]));
                for (const row of _res.rows)
                    yield yield __await(new UserAuditLog(row._uid, row.user_agent, row._type, row._relevance, row.created_at, row.destroys_at, row._data));
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
    static GetPageCount(uid, filters = UserAuditLog.Relevance.ANY) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const _res = yield client.query(`SELECT COUNT(1) FROM user_audit_log WHERE uid = $1AND _relevance & $2 != 0 `, [uid, filters]);
                return _res.rows[0].count;
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
    static Fetch(uid, filters = UserAuditLog.Relevance.ANY) {
        return __asyncGenerator(this, arguments, function* Fetch_1() {
            const client = yield __await(conn_1.pgConn.connect());
            try {
                const _res = yield __await(client.query(`SELECT * FROM user_audit_log WHERE _uid = $1 AND _relevance & $2 != 0 ORDER BY created_at DESC`, [uid, filters]));
                for (const row of _res.rows)
                    yield yield __await(new UserAuditLog(row._uid, row.user_agent, row._type, row._relevance, row.created_at, row.destroys_at, row._data));
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
    static Add(uid, userAgent, type, relevance, extras) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                var _data = null;
                if (extras)
                    _data = (0, safe_stable_stringify_1.default)(extras);
                userAgent = RSEngine_1.RSMisc.AnonymizeAgent(userAgent);
                yield client.query(`INSERT INTO user_audit_log (_uid, _type, _relevance, user_agent, _data) VALUES ($1, $2, $3, $4, $5)`, [uid, type, relevance, userAgent, _data]);
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
exports.UserAuditLog = UserAuditLog;
(function (UserAuditLog) {
    let Relevance;
    (function (Relevance) {
        Relevance[Relevance["LOW"] = 1] = "LOW";
        Relevance[Relevance["MEDIUM"] = 2] = "MEDIUM";
        Relevance[Relevance["HIGH"] = 4] = "HIGH";
        Relevance[Relevance["ANY"] = 7] = "ANY";
    })(Relevance = UserAuditLog.Relevance || (UserAuditLog.Relevance = {}));
    let Type;
    (function (Type) {
        Type[Type["FAILED_LOGIN"] = 0] = "FAILED_LOGIN";
        Type[Type["LOGIN"] = 1] = "LOGIN";
        Type[Type["LOGOUT"] = 2] = "LOGOUT";
        Type[Type["PASSWORD_CHANGE_REQUEST"] = 3] = "PASSWORD_CHANGE_REQUEST";
        Type[Type["FORGOT_PASSWORD"] = 4] = "FORGOT_PASSWORD";
        Type[Type["PASSWORD_CHANGE"] = 5] = "PASSWORD_CHANGE";
        Type[Type["EMAIL_ADD"] = 6] = "EMAIL_ADD";
        Type[Type["EMAIL_REMOVE"] = 7] = "EMAIL_REMOVE";
        Type[Type["MAIN_EMAIL_CHANGE"] = 8] = "MAIN_EMAIL_CHANGE";
        Type[Type["AUDIT_LOG_REQUESTED"] = 9] = "AUDIT_LOG_REQUESTED";
        Type[Type["ADDED_TWOFACTOR"] = 10] = "ADDED_TWOFACTOR";
        Type[Type["REMOVED_TWOFACTOR"] = 11] = "REMOVED_TWOFACTOR";
        Type[Type["DELETE_ACCOUNT_REQUESTED"] = 12] = "DELETE_ACCOUNT_REQUESTED";
        Type[Type["DELETE_ACCOUNT_REJECTED"] = 13] = "DELETE_ACCOUNT_REJECTED";
        Type[Type["PROFILE_UPDATE"] = 14] = "PROFILE_UPDATE";
        Type[Type["FAILED_SECURITY_ACCESS"] = 15] = "FAILED_SECURITY_ACCESS";
        Type[Type["FAILED_PASSWORD_CHANGE"] = 16] = "FAILED_PASSWORD_CHANGE";
    })(Type = UserAuditLog.Type || (UserAuditLog.Type = {}));
})(UserAuditLog || (exports.UserAuditLog = UserAuditLog = {}));
class Config {
    static Get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT _value FROM config WHERE _key = $1', [key]);
                return res.rowCount === 0 ? 0 : res.rows[0]._value;
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
}
exports.Config = Config;
class Commissions {
    static GetStatus(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT deadline, curl, cancel_reason, paypal_id FROM commissions WHERE id = $1', [id]);
                if (res.rowCount === 0)
                    return Commissions.Status.EXPIRED;
                const commission = res.rows[0];
                if (commission.paypal_id)
                    return Commissions.Status.PAID;
                if (commission.cancel_reason)
                    return Commissions.Status.DECLINED;
                if (commission.curl)
                    return Commissions.Status.FINISHED;
                if (commission.deadline) {
                    if (commission.deadline.getTime() < Date.now())
                        return Commissions.Status.EXPIRED;
                    return Commissions.Status.ACCEPTED;
                }
                return Commissions.Status.WAITING;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return Commissions.Status.EXPIRED;
        });
    }
    static StatusBanner(status, extras) {
        var badgeClass = 'badge', name = '';
        switch (status) {
            case Commissions.Status.WAITING:
                name = 'Waiting';
                break;
            case Commissions.Status.ACCEPTED:
                badgeClass += ' generic';
                name = 'In process';
                break;
            case Commissions.Status.DECLINED:
                badgeClass += ' alert';
                name = 'Declined';
                break;
            case Commissions.Status.FINISHED:
                badgeClass += ' success';
                name = 'Finished';
                break;
            case Commissions.Status.PAID:
                badgeClass += ' success';
                name = 'Paid';
                break;
            case Commissions.Status.EXPIRED:
                badgeClass += ' warning';
                name = 'Deadline expired';
                break;
        }
        if (extras)
            badgeClass += ` ${extras}`;
        return `<span class="${badgeClass}"><span class="dot"></span>${name}</span>`;
    }
    static GetOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT id, _title, author FROM commissions WHERE curl IS NULL AND cancel_reason IS NULL AND (deadline IS NULL OR deadline > NOW()) ORDER BY created_at ASC');
                return res.rows;
            }
            catch (e) {
                globals_1.logger.error(e);
            }
            finally {
                client.release();
            }
            return [];
        });
    }
    static GetOpenCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield conn_1.pgConn.connect();
            try {
                const res = yield client.query('SELECT COUNT(1) FROM commissions WHERE curl IS NULL AND cancel_reason IS NULL AND (deadline IS NULL OR deadline > NOW())');
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
}
exports.Commissions = Commissions;
(function (Commissions) {
    let Status;
    (function (Status) {
        Status[Status["WAITING"] = 0] = "WAITING";
        Status[Status["ACCEPTED"] = 1] = "ACCEPTED";
        Status[Status["DECLINED"] = 2] = "DECLINED";
        Status[Status["FINISHED"] = 3] = "FINISHED";
        Status[Status["PAID"] = 4] = "PAID";
        Status[Status["EXPIRED"] = 5] = "EXPIRED";
    })(Status = Commissions.Status || (Commissions.Status = {}));
})(Commissions || (exports.Commissions = Commissions = {}));
//# sourceMappingURL=db.js.map