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
const http_errors_1 = __importDefault(require("http-errors"));
const globals_1 = require("../globals");
const db_1 = require("../libs/db");
const rateLimiter_1 = require("../libs/rateLimiter");
const router = express_1.default.Router();
router.get('/:token', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield (0, rateLimiter_1.rateLimiterBruteForce)(req, res, next);
    }
    catch (e) {
        return next((0, http_errors_1.default)(429, 'Too many requests.'));
    }
    const tokenData = yield res.rs.client.token();
    var redirect = tokenData ? '/accounts/settings' : '/accounts/signin?verified=1';
    if ((_a = req.useragent) === null || _a === void 0 ? void 0 : _a.isBot)
        return next((0, http_errors_1.default)(403, 'Forbidden'));
    try {
        if (yield db_1.Email.Verify(req.params.token))
            return res.redirect(redirect);
        next((0, http_errors_1.default)(403, 'Forbidden'));
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=verify-email.js.map