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
const RSEngine_1 = require("../libs/RSEngine");
const ejs_1 = __importDefault(require("ejs"));
const http_errors_1 = __importDefault(require("http-errors"));
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.rs.html.meta.setSubtitle('Privacy Policy');
        res.rs.html.meta.description = "When you use RobotoSkunk services, you're trusting him your personal information. This privacy policy explains what information we collect, how we use it, and what we do with it.";
        res.rs.html.head = `<link rel="preload" href="/resources/css/bored-stuff.css?v=${res.rs.conf.version}" as="style">
			<link rel="stylesheet" href="/resources/css/bored-stuff.css?v=${res.rs.conf.version}">`;
        const date = RSEngine_1.RSTime.SetTimezone(new Date(2023, RSEngine_1.RSTime.MONTH_INDEX.JANUARY, 14), -5);
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('privacy.ejs'), { lastUpdate: date.getTime(), nonce: res.rs.server.nonce });
        yield res.renderDefault('layout.ejs', {
            checkIfUserHasBirthdate: false
        });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=privacy.js.map