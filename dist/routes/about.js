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
const ejs_1 = __importDefault(require("ejs"));
const http_errors_1 = __importDefault(require("http-errors"));
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.rs.html.meta.setSubtitle('About');
        res.rs.html.meta.description = 'Meet a few more about the person behind RobotoSkunk.';
        res.rs.html.head = `<link rel="preload" href="/resources/css/about.css?v=${res.rs.env.version}" as="style">
			<link rel="stylesheet" href="/resources/css/about.css?v=${res.rs.env.version}">
			<script defer src="/resources/js/about.js?v=${res.rs.env.version}" nonce="${res.rs.server.nonce}"></script>`;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('about.ejs'));
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=about.js.map