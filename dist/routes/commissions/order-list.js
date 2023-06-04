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
const ejs_1 = __importDefault(require("ejs"));
const comms_1 = require("../../data/comms");
const db_1 = require("../../libraries/db");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.pgConn.connect();
    res.rs.server.aEnabled = false;
    try {
        var isAdmin = false, local = [], page = 0;
        const tokenData = yield res.rs.client.token();
        if (tokenData) {
            const user = yield tokenData.token.GetUser();
            isAdmin = user.roles.has('OWNER');
        }
        if (req.query.page) {
            page = parseInt(req.query.page);
            if (isNaN(page))
                page = 0;
        }
        const cookie = req.cookies['commissions'];
        if (cookie) {
            try {
                local = JSON.parse(cookie);
                if (!Array.isArray(local))
                    throw new Error('Invalid cookie');
            }
            catch (e) {
                res.clearCookie('commissions');
            }
        }
        res.rs.html.head = `<link rel="preload" href="/resources/css/comms.css" as="style">
			<link rel="stylesheet" href="/resources/css/comms.css">`;
        const comms = [];
        var maxPage = 0;
        if (tokenData) {
            const data = isAdmin ?
                (yield client.query(`SELECT id, _title, created_at FROM commissions ORDER BY created_at DESC LIMIT 10 OFFSET $1;`, [page * 10])).rows :
                (yield client.query(`SELECT id, _title, created_at FROM commissions WHERE author = $1 OR id = ANY($2) ORDER BY created_at DESC LIMIT 10 OFFSET $3;`, [tokenData.token.usrid, local, page * 10])).rows;
            const count = isAdmin ?
                (yield client.query(`SELECT COUNT(1) FROM commissions;`)).rows[0].count :
                (yield client.query(`SELECT COUNT(1) FROM commissions WHERE author = $1 OR id = ANY($2);`, [tokenData.token.usrid, local])).rows[0].count;
            maxPage = Math.ceil(count / 10);
            for (const row of data) {
                const status = yield db_1.Commissions.GetStatus(row.id);
                comms.push({
                    id: row.id,
                    label: row._title,
                    status: db_1.Commissions.StatusBanner(status, 'negative'),
                    createdAt: row.created_at.getTime()
                });
            }
        }
        else {
            const data = (yield client.query(`SELECT id, _title, created_at FROM commissions WHERE id = ANY($1) ORDER BY created_at DESC LIMIT 10 OFFSET $2;`, [local, page * 10])).rows;
            const count = (yield client.query(`SELECT COUNT(1) FROM commissions WHERE id = ANY($1);`, [local])).rows[0].count;
            maxPage = Math.ceil(count / 10);
            for (const row of data) {
                const status = yield db_1.Commissions.GetStatus(row.id);
                comms.push({
                    id: row.id,
                    label: row._title,
                    status: db_1.Commissions.StatusBanner(status, 'negative'),
                    createdAt: row.created_at.getTime()
                });
            }
        }
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('commissions/order-list.ejs'), {
            articles: comms_1.articles,
            commissions: comms,
            nonce: res.rs.server.nonce,
            page,
            maxPage
        });
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
    finally {
        client.release();
    }
}));
module.exports = router;
//# sourceMappingURL=order-list.js.map