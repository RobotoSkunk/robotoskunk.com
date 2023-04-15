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
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const globals_1 = require("../../globals");
const RSEngine_1 = require("../../libs/RSEngine");
const db_1 = require("../../libs/db");
const db_utils_1 = require("../../libs/db-utils");
const router = express_1.default.Router();
router.get('/:article', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const article = comms_1.articles.find(a => a.id === req.params.article);
        if (!article)
            return next((0, http_errors_1.default)(404, 'Article not found'));
        const count = yield db_1.Commissions.GetOpen();
        const commsLimit = yield db_1.Config.Get('commissions-limit');
        if (count.length >= commsLimit) {
            res.rs.html.meta = {
                'title': 'Queue is full!!1 :(',
                'description': 'The queue is full, please try again later.',
                'img': `${res.rs.conf.root}/resources/img/meta-icon.webp`
            };
            res.rs.error = {
                'code': 'Queue is full :(',
                'message': 'Sorry, but the queue is full. Please try again later.',
                'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
                'imgAlt': 'Alex Skunk dizzy on the floor'
            };
            return yield res.renderDefault('layout-http-error.ejs');
        }
        const tokenData = yield res.rs.client.token();
        if (tokenData) {
            const user = yield tokenData.token.GetUser();
            const status = yield user.CheckSpecificBlacklist(db_utils_1.Blacklist.FLAGS.COMMISSIONS);
            if (status) {
                var reason = '';
                if (status.reason)
                    reason = `<br><b>Reason</b>: ${status.reason}`;
                if (status.ends_at)
                    reason += `<br>(until <script nonce="${res.rs.server.nonce}">document.write(new Date(${status.ends_at.getTime()}).toLocaleString())</script>)`;
                res.rs.html.meta = {
                    'title': `You can't request commissions`,
                    'description': 'You have been banned from requesting commissions. If you think this is a mistake, please contact us.',
                    'img': `${res.rs.conf.root}/resources/img/meta-icon.webp`
                };
                res.rs.error = {
                    'code': `You can't request commissions`,
                    'message': `You have been banned from requesting commissions.${reason}`,
                    'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
                    'imgAlt': 'Alex Skunk dizzy on the floor'
                };
                return yield res.renderDefault('layout-http-error.ejs');
            }
        }
        const discount = yield db_1.Config.Get('commissions-discount');
        res.rs.html.head = `<link rel="preload" href="/resources/css/comms.css" as="style">
			<link rel="stylesheet" href="/resources/css/comms.css">

			<script nonce="${res.rs.server.nonce}">const article = ${(0, safe_stable_stringify_1.default)(article)}; const discount = ${discount};</script>
			<script defer nonce="${res.rs.server.nonce}" src="/resources/js/article.js"></script>`;
        res.rs.html.body = (yield ejs_1.default.renderFile(res.getEJSPath('commissions/article.ejs'), {
            name: article.label,
            description: article.description,
            options: article.options,
            price: article.price,
            size: article.size
        })).replace(/(\t|\r\n|\r|\n)/gm, '');
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
router.post('/:article', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.pgConn.connect();
    try {
        const commsLimit = yield db_1.Config.Get('commissions-limit');
        const count = yield db_1.Commissions.GetOpenCount();
        if (count >= commsLimit)
            return res.status(429).json({
                message: 'The commissions queue is full, please try again later.'
            });
        const tokenData = yield res.rs.client.token();
        if (!(yield db_1.Config.Get('commissions-anonymous')) && !tokenData) {
            return res.status(401).json({
                message: 'You must be logged in to request a commission.'
            });
        }
        if (tokenData) {
            const user = yield tokenData.token.GetUser();
            if (((yield user.CheckBlacklist()) & db_utils_1.Blacklist.FLAGS.COMMISSIONS) !== 0)
                return res.status(403).json({ message: 'You have been banned from requesting commissions.' });
            const e = yield user.GetPrimaryEmail();
            if (!e.verified)
                return res.status(403).json({ message: 'You must verify your email to request a commission.' });
        }
        // #region Process body
        const article = comms_1.articles.find(a => a.id === req.params.article);
        if (!article)
            return next((0, http_errors_1.default)(404, 'Article not found'));
        const body = req.body;
        const s = body.canvas.split('x');
        var desc = body.description, cx = Number.parseInt(s[0]), cy = Number.parseInt(s[1]);
        if (typeof desc !== 'string' || isNaN(cx) || isNaN(cy))
            return next((0, http_errors_1.default)(400, 'Missing fields'));
        desc = desc.trim();
        if (desc.length === 0)
            return next((0, http_errors_1.default)(400, 'Invalid description'));
        if (desc.length > 1000)
            return next((0, http_errors_1.default)(400, 'Description too long'));
        // #endregion
        // #region Create and calculate invoice
        const invoice = {
            version: 2,
            data: [{
                    options: [{
                            label: 'Commission price',
                            value: article.price,
                            type: 'price'
                        }],
                    total: article.price
                }]
        };
        for (const option of article.options) {
            if (!invoice.data[option.group])
                invoice.data[option.group] = { options: [], total: 0 };
            const data = invoice.data[option.group];
            if (!body.hasOwnProperty(option.id))
                return next((0, http_errors_1.default)(400, 'Missing fields'));
            switch (option.type) {
                case 'radio':
                    const opt = option.options.find(o => o.id === req.body[option.id]);
                    if (!opt)
                        return next((0, http_errors_1.default)(400, 'Missing fields'));
                    data.options.push({
                        label: option.label,
                        name: opt.label,
                        value: opt.value,
                        type: 'price'
                    });
                    data.total += opt.value;
                    break;
                case 'number':
                    var num = Number.parseInt(req.body[option.id]);
                    if (isNaN(num))
                        return next((0, http_errors_1.default)(400, 'Invalid fields'));
                    num *= option.data.value;
                    switch (option.data.action) {
                        case 'add':
                            data.total += num;
                            break;
                        case 'multiply':
                            data.total *= num;
                            break;
                    }
                    data.options.push({
                        label: option.label,
                        value: num,
                        type: option.data.action
                    });
                    break;
            }
        }
        if (article.size.custom) {
            cx = RSEngine_1.RSMath.Clamp(cx, 100, 10000);
            cy = RSEngine_1.RSMath.Clamp(cy, 100, 10000);
        }
        else if (!article.size.defaults.some(s => s[0] === cx && s[1] === cy)) {
            cx = article.size.defaults[0][0];
            cy = article.size.defaults[0][1];
        }
        const price = invoice.data.reduce((a, b) => a + b.total, 0);
        // #endregion
        var uid = tokenData ? tokenData.token.usrid : null;
        const id = RSEngine_1.RSCrypto.RandomBytes(16);
        // #region Create commission
        yield client.query(`INSERT INTO commissions (id, author, _title, _desc, _size, price, discount, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            id,
            uid,
            article.label,
            desc,
            `(${cx}, ${cy})`,
            price,
            yield db_1.Config.Get('commissions-discount'),
            (0, safe_stable_stringify_1.default)(invoice)
        ]);
        // #endregion
        if (!tokenData) {
            const cookie = req.cookies['commissions'];
            var local = [];
            if (cookie) {
                try {
                    local = JSON.parse(cookie);
                    if (Array.isArray(local))
                        local.push(id);
                }
                catch (e) {
                    res.clearCookie('commissions');
                    local = [id];
                }
            }
            else
                local = [id];
            res.cookie('commissions', (0, safe_stable_stringify_1.default)(local), {
                maxAge: RSEngine_1.RSTime._YEAR_ / 1000 * 10,
                httpOnly: true,
                sameSite: 'lax',
                secure: globals_1.conf.production && !res.rs.client.isOnion,
                path: '/',
                domain: res.rs.client.isOnion ? undefined : (globals_1.conf.production ? `.${globals_1.conf.domain}` : 'localhost')
            });
        }
        res.status(200).json({
            message: 'Commission created successfully!', id
        });
    }
    catch (e) {
        globals_1.logger.error(e);
        next((0, http_errors_1.default)(500, 'Something went wrong...'));
    }
    finally {
        client.release();
    }
}));
module.exports = router;
//# sourceMappingURL=article.js.map