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
const express_1 = __importDefault(require("express"));
const globals_1 = require("../globals");
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const http_errors_1 = __importDefault(require("http-errors"));
const db_1 = require("../libraries/db");
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
// file deepcode ignore HTTPSourceWithUncheckedType: Schema.validate() is used
const router = express_1.default.Router();
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const conn = yield db_1.pgConn.connect();
    try {
        if ((_a = req.useragent) === null || _a === void 0 ? void 0 : _a.isBot)
            return next((0, http_errors_1.default)(403, 'Forbidden'));
        const body = req.body;
        if (typeof body['csp-report'] !== 'object')
            return next((0, http_errors_1.default)(400, 'Invalid CSP report'));
        if (typeof body['csp-report']['blocked-uri'] !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid CSP report'));
        body['csp-report']['blocked-uri'] = body['csp-report']['blocked-uri'].trim();
        const ignoredDomains = [
            'https://fonts.googleapis.com',
            'http://localhost',
            'chrome://',
            'chromeinvoke://',
            'chromeinvokeimmediate://',
            'webviewprogressproxy://',
            'mbinit://',
            'http://127.0.0.1',
            'resource://',
            'jar:file:///'
        ];
        for (const domain of ignoredDomains) {
            if (body['csp-report']['blocked-uri'].startsWith(domain))
                return res.status(200);
        }
        const report = Object.assign({
            'user-agent': RSEngine_1.RSUtils.AnonymizeAgent(req.headers['user-agent']),
        }, req.body);
        const _res = yield conn.query('INSERT INTO csp_reports (_data) VALUES ($1) RETURNING id', [(0, safe_stable_stringify_1.default)(report)]);
        globals_1.logger.error(`CSP violation, check the database for more information. (Case ${_res.rows[0].id})`);
        res.status(200);
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
    finally {
        conn.release();
    }
}));
module.exports = router;
//# sourceMappingURL=csp-report.js.map