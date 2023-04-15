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
exports.rateLimiterBruteForce = exports.rateLimiterMiddleware = exports.__httpError = exports.__setHeaderAuto = exports.__setHeader = exports.bruteForceLimiters = exports.__commentLimiter = exports.__rateLimiter = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const RSEngine_1 = require("./RSEngine");
const http_errors_1 = __importDefault(require("http-errors"));
const globals_1 = require("../globals");
const db_1 = require("./db");
const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;
exports.__rateLimiter = new rate_limiter_flexible_1.RateLimiterPostgres({
    storeClient: db_1.rtConn,
    tableName: 'rate_limiter',
    points: 50,
    duration: 1,
    keyPrefix: 'main',
    blockDuration: minute,
    inmemoryBlockOnConsumed: 51,
    clearExpiredByTimeout: true
});
exports.__commentLimiter = new rate_limiter_flexible_1.RateLimiterPostgres({
    storeClient: db_1.rtConn,
    tableName: 'rate_limiter',
    points: 1,
    duration: minute * 5,
    keyPrefix: 'shout',
    blockDuration: minute * 5,
    inmemoryBlockOnConsumed: 2,
    clearExpiredByTimeout: true
});
exports.bruteForceLimiters = {
    byIP: new rate_limiter_flexible_1.RateLimiterPostgres({
        storeClient: db_1.rtConn,
        tableName: 'rate_limiter',
        points: 100,
        duration: day,
        keyPrefix: 'bf_ip',
        blockDuration: day,
        inmemoryBlockOnConsumed: 101,
        clearExpiredByTimeout: true
    }),
    failedAttemptsAndIP: new rate_limiter_flexible_1.RateLimiterPostgres({
        storeClient: db_1.rtConn,
        tableName: 'rate_limiter',
        points: 10,
        duration: hour,
        keyPrefix: 'bf_att_ip',
        blockDuration: hour,
        inmemoryBlockOnConsumed: 11,
        clearExpiredByTimeout: true
    }),
    wrongTokenInConfig: new rate_limiter_flexible_1.RateLimiterPostgres({
        storeClient: db_1.rtConn,
        tableName: 'rate_limiter',
        points: 10,
        duration: day,
        keyPrefix: 'bf_token',
        blockDuration: day,
        inmemoryBlockOnConsumed: 11,
        clearExpiredByTimeout: true
    })
};
function __setHeader(res, ms) {
    res.header('Retry-After', '' + ~~(ms / 1000));
}
exports.__setHeader = __setHeader;
function __setHeaderAuto(res, limiterRes) {
    __setHeader(res, limiterRes.msBeforeNext);
}
exports.__setHeaderAuto = __setHeaderAuto;
exports.__httpError = (0, http_errors_1.default)(429, 'Too many requests.');
function rateLimiterMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (res.isApi)
            return next();
        try {
            yield exports.__rateLimiter.consume(RSEngine_1.RSCrypto.HMAC(req.ip, globals_1.conf.keys.RATE_LIMITER));
            next();
        }
        catch (e) {
            if (!(e instanceof Error))
                __setHeaderAuto(res, e);
            next(exports.__httpError);
        }
    });
}
exports.rateLimiterMiddleware = rateLimiterMiddleware;
;
function rateLimiterBruteForce(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exports.bruteForceLimiters.byIP.consume(RSEngine_1.RSCrypto.HMAC(req.ip, globals_1.conf.keys.RATE_LIMITER));
        }
        catch (e) {
            if (!(e instanceof Error))
                __setHeaderAuto(res, e);
            next(exports.__httpError);
            throw new Error('Too many requests');
        }
    });
}
exports.rateLimiterBruteForce = rateLimiterBruteForce;
//# sourceMappingURL=rateLimiter.js.map