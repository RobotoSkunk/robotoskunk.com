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
const globals_1 = require("../../globals");
const env_1 = __importDefault(require("../../env"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const rateLimiter_1 = require("../../libraries/rateLimiter");
const db_1 = require("../../libraries/db");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield res.rs.client.token();
    if (!token)
        return next((0, http_errors_1.default)(403, 'You are not logged in.'));
    const user = yield token.token.GetUser();
    const deleteDate = yield user.GetDeleteDate();
    res.rs.html.meta = {
        'title': 'Delete Account',
        'description': 'We are sorry to see you go. Please confirm your account deletion.',
        'img': `/resources/img/meta-icon.webp`
    };
    res.rs.html.head = `<link rel="preload" href="/resources/svg/eye-enable.svg" as="image" type="image/svg+xml">
		<link rel="preload" href="/resources/svg/eye-disable.svg" as="image" type="image/svg+xml">
		<link rel="preload" href="/resources/css/common/loader.css?v=<%= locals.env.version %>" as="style">

		<link rel="stylesheet" href="/resources/css/common/loader.css?v=<%= locals.env.version %>">
		<script defer src="/resources/js/utils.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>
		<script defer src="/resources/js/delete-account.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>
		<script defer src="https://js.hcaptcha.com/1/api.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;
    res.rs.error = {
        'code': 'Delete your account',
        'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
        'imgAlt': 'Alex Skunk dizzy on the floor',
        'message': ''
    };
    res.rs.error.message = `<input type="hidden" id="h-captcha" data-sitekey="${env_1.default.hcaptcha_keys.site_key}">`;
    if (!deleteDate) {
        res.rs.error.message += `Are you sure you want to delete your account? This action cannot be undone.
			<br><br>
			<button class="danger" id="open-panel">Delete my account</button>`;
    }
    else {
        res.rs.error.message += `Your account will be deleted on ${RSEngine_1.RSTime.Relative(deleteDate)}.<br><br>

			<button class="success" id="open-panel">Cancel account deletion</button>`;
    }
    yield res.renderDefault('layout-http-error.ejs', {
        checkBannedUser: false,
        checkIfUserHasBirthdate: false,
        analyticsEnabled: false,
        useZxcvbn: false
    });
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    res.minify = false;
    try {
        const token = yield res.rs.client.token();
        if (!token)
            return next((0, http_errors_1.default)(403, 'You are not logged in.'));
        var validRecaptcha = false;
        if (req.body['h-captcha-response'])
            validRecaptcha = yield RSEngine_1.RSUtils.VerifyCaptcha(req.body['h-captcha-response'], env_1.default.hcaptcha_keys.secret_key);
        if (!validRecaptcha)
            return res.status(403).json({ 'message': 'Invalid captcha' });
        if (typeof req.body.password !== 'string')
            return next((0, http_errors_1.default)(400, 'Invalid password'));
        const user = yield token.token.GetUser();
        const _res = yield user.Delete(req.body.password, !Boolean(yield user.GetDeleteDate()));
        if (!_res) {
            const _limiterKey = RSEngine_1.RSCrypto.HMAC(`${req.ip}:${user.id}`, env_1.default.keys.RATE_LIMITER);
            try {
                yield rateLimiter_1.bruteForceLimiters.failedAttemptsAndIP.consume(_limiterKey);
            }
            catch (e) {
                var ms;
                var msg = 'Please try again later.';
                if (!(e instanceof Error))
                    ms = e.msBeforeNext;
                if (ms) {
                    (0, rateLimiter_1.__setHeader)(res, ms);
                    msg = `Please try again in ${RSEngine_1.RSTime.ToString(ms)}.`;
                }
                res.status(429).json({ message: msg });
                return;
            }
            res.status(403).json({ message: 'Wrong password.' });
            return;
        }
        const gonnaBeDeleted = Boolean(yield user.GetDeleteDate());
        if (gonnaBeDeleted) {
            yield (yield user.GetPrimaryEmail()).Send(db_1.LegacyEmail.MailType.ACCOUNT_DELETION);
            db_1.UserAuditLog.Add(user.id, (_a = req.useragent) === null || _a === void 0 ? void 0 : _a.source, db_1.UserAuditLog.Type.DELETE_ACCOUNT_REQUESTED, db_1.UserAuditLog.Relevance.HIGH);
        }
        else {
            db_1.UserAuditLog.Add(user.id, (_b = req.useragent) === null || _b === void 0 ? void 0 : _b.source, db_1.UserAuditLog.Type.DELETE_ACCOUNT_REJECTED, db_1.UserAuditLog.Relevance.LOW);
        }
        res.status(200).send({ 'message': 'OK' });
    }
    catch (e) {
        globals_1.logger.error(e);
        return next((0, http_errors_1.default)(500, 'An error occurred while processing your request.'));
    }
}));
module.exports = router;
//# sourceMappingURL=delete.js.map