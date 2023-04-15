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
const db_utils_1 = require("../libs/db-utils");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            res.redirect('/');
        const user = yield tokenData.token.GetUser();
        if (((yield user.CheckBlacklist()) & db_utils_1.Blacklist.FLAGS.BANNED) === 0)
            res.redirect('/');
        res.rs.html.meta.setSubtitle("You can't use this website");
        res.rs.html.meta.description = "You have been banned from using this website. If you think this is a mistake, please contact us.";
        const status = yield user.CheckSpecificBlacklist(db_utils_1.Blacklist.FLAGS.BANNED);
        var reason = '';
        if (status.reason)
            reason = `<br><b>Reason</b>: ${status.reason}`;
        if (status.ends_at)
            reason += `<br>(until <script nonce="${res.rs.server.nonce}">document.write(new Date(${status.ends_at.getTime()}).toLocaleString())</script>)`;
        res.rs.error = {
            code: 'Your account has been banned',
            message: `We have noticed that the activity of your account has violated our terms of service and therefore we can't offer you services anymore.${reason}<br><br><a href="/accounts/logout" class="btn">Log out</a>`,
            imgPath: '/resources/svg/alex-skunk/dizzy.svg',
            imgAlt: 'Dizzy skunk'
        };
        yield res.renderDefault('layout-http-error.ejs', { 'checkBannedUser': false });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=banned.js.map