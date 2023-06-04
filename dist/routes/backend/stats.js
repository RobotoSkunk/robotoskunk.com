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
const globals_1 = require("../../globals");
const http_errors_1 = __importDefault(require("http-errors"));
const analytics_1 = require("../../libraries/analytics");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenData = yield res.rs.client.token();
        if (!tokenData)
            return next((0, http_errors_1.default)(404, 'Not found.'));
        const user = yield tokenData.token.GetUser();
        if (!(user.roles.has('OWNER') || user.roles.has('ADMIN')))
            return next((0, http_errors_1.default)(404, 'Not found.'));
        const data = yield analytics_1.Analytics.GetVisits();
        // for (const key of keys) {
        // 	if (Math.random() > 0.5) continue;
        // 	const visits = ~~(Math.random() * 50000)
        // 	data[key] = {
        // 		visits,
        // 		today: ~~(Math.random() * visits)
        // 	}
        // }
        res.json({ countries: data });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, e));
    }
}));
module.exports = router;
//# sourceMappingURL=stats.js.map