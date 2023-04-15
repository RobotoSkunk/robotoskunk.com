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
const http_errors_1 = __importDefault(require("http-errors"));
const db_1 = require("../../libs/db");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield res.rs.client.token();
    if (!tokenData)
        res.redirect('/');
    res.rs.html.meta.setSubtitle('Logout');
    res.rs.html.head = `<script defer src="/resources/js/logout.js?v=${res.rs.conf.version}" nonce="${res.rs.server.nonce}"></script>`;
    res.rs.html.body = `<div class="section" data-height="250">
			<h1>Log out</h1>
			<p>Are you sure you want to log out?</p>

			<button class="submit" data-type="logout">Log out</button>
			<button class="submit" data-type="cancel">Cancel</button>
		</div>`;
    yield res.renderDefault('layout-api-form.ejs', {
        denyIfLoggedIn: false,
        checkBannedUser: false,
        checkIfUserHasBirthdate: false
    });
}));
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tokenData = yield res.rs.client.token();
        if (tokenData)
            yield tokenData.token.Destroy();
        res.clearCookie('auth_token');
        res.redirect('/');
        yield db_1.UserAuditLog.Add(tokenData.token.usrid, (_a = req.useragent) === null || _a === void 0 ? void 0 : _a.source, db_1.UserAuditLog.Type.LOGIN, db_1.UserAuditLog.Relevance.LOW);
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=logout.js.map