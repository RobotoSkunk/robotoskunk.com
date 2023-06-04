"use strict";
/*
    robotoskunk.com - The whole main website of RobotoSkunk.
    Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const globals_1 = require("../../globals");
const db_1 = require("../../libraries/db");
const PayPal = __importStar(require("../../libraries/paypal"));
const router = express_1.default.Router();
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.rs.server.aEnabled = false;
        const comm = (yield db_1.pgConn.query('SELECT * FROM commissions WHERE id = $1', [req.params.id])).rows[0];
        if (!comm)
            return next((0, http_errors_1.default)(404, 'Commission not found'));
        const tokenData = yield res.rs.client.token();
        var email = null;
        if (comm.author) {
            if (!tokenData)
                return next((0, http_errors_1.default)(401, 'You must be logged in to view this page'));
            const user = yield tokenData.token.GetUser();
            if (user.id !== comm.author && !user.roles.has('OWNER'))
                return next((0, http_errors_1.default)(403, 'You do not have permission to view this page'));
            if (user.roles.has('OWNER')) {
                const u = yield db_1.LegacyUser.GetById(comm.author);
                const e = yield u.GetPrimaryEmail();
                email = yield e.Read(yield u.GetCryptoKey());
            }
        }
        res.rs.html.head = `<link rel="preload" href="/resources/css/order.css" as="style">
			<link rel="stylesheet" href="/resources/css/order.css">

			<script defer src="/resources/js/order.js" nonce="${res.rs.server.nonce}"></script>`;
        const groups = [];
        switch (comm.details.version) {
            case 1:
                const group = [];
                for (const row of comm.details.data)
                    group.push(row);
                groups.push(group);
                break;
            case 2:
                for (const group of comm.details.data) {
                    const newGroup = [];
                    for (const row of group.options) {
                        var value = row.value.toString();
                        switch (row.type) {
                            case 'add':
                                value = `+ ${row.value}`;
                                break;
                            case 'multiply':
                                value = `x ${row.value}`;
                                break;
                            case 'price':
                                value = `$${row.value} USD`;
                                break;
                        }
                        newGroup.push({
                            label: `<b>${row.label}</b>` + (row.name ? `: ${row.name}` : ''),
                            value: value
                        });
                    }
                    newGroup.push({
                        label: '',
                        value: `$${group.total.toFixed(2)} USD`
                    });
                    groups.push(newGroup);
                }
                break;
        }
        const status = yield db_1.Commissions.GetStatus(comm.id);
        var preview = comm.preview;
        if (comm.curl && !comm.preview) {
            if (comm.curl.startsWith('https://drive.google.com/file/d/')) {
                const url = new URL(comm.curl);
                const id = url.pathname.split('/')[3];
                // curl = `https://drive.google.com/uc?export=view&id=${id}`;
                preview = `https://drive.google.com/thumbnail?id=${id}`;
            }
        }
        var price = Number.parseFloat(comm.price.replace('$', ''));
        if (comm.discount)
            price *= 1 - comm.discount;
        res.rs.html.body = yield ejs_1.default.renderFile(res.getEJSPath('commissions/order.ejs'), {
            nonce: res.rs.server.nonce,
            paypal: globals_1.env.paypal.id,
            title: comm._title,
            canvas: `${comm._size.x} x ${comm._size.y}`,
            deadline: comm.deadline ? `<script nonce="${res.rs.server.nonce}">document.write(new Date(${comm.deadline.getTime()}).toLocaleDateString());</script>` : '<i>Still negotiating...</i>',
            description: comm._desc,
            invoice: groups,
            price: price.toFixed(2),
            discount: comm.discount.toFixed(2),
            status: db_1.Commissions.StatusBanner(status, 'negative'),
            cancelReason: comm.cancel_reason,
            paid: status === db_1.Commissions.Status.PAID,
            curl: comm.curl,
            preview: preview,
            id: comm.id,
            email
        });
        yield res.renderDefault('layout.ejs');
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
}));
router.post('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.pgConn.connect();
    try {
        const comm = (yield db_1.pgConn.query('SELECT price, discount FROM commissions WHERE id = $1', [req.params.id])).rows[0];
        if (!comm)
            return next((0, http_errors_1.default)(404, 'Commission not found'));
        if (!req.body.paypal)
            return next((0, http_errors_1.default)(400, 'Missing paypal ID'));
        const status = yield db_1.Commissions.GetStatus(req.params.id);
        if (status === db_1.Commissions.Status.PAID)
            return res.status(400).json({
                success: false,
                message: 'Thank you for your payment, but this commission has already been paid for. The payment has been rejected.'
            });
        if (status !== db_1.Commissions.Status.FINISHED)
            return res.status(400).json({
                success: false,
                message: 'The commission is not finished yet. The payment has been rejected.'
            });
        var price = Number.parseFloat(comm.price.replace('$', ''));
        if (comm.discount)
            price *= 1 - comm.discount;
        const capture = yield PayPal.capturePayment(req.body.paypal);
        if (!capture)
            return next((0, http_errors_1.default)(400, 'Invalid paypal ID'));
        const amount = capture.purchase_units[0].payments.captures[0].amount;
        if (Number.parseFloat(amount.value) < price)
            return res.status(400).json({
                success: false,
                message: 'The price of the commission does not match the price of the payment. Please contact RobotoSkunk if you believe this is an error.'
            });
        if (amount.currency_code !== 'USD')
            return res.status(400).json({
                success: false,
                message: 'The currency of the commission does not match the currency of the payment. Please contact RobotoSkunk if you believe this is an error.'
            });
        yield client.query(`UPDATE commissions SET paypal_id = $1, paypal_paid_at = NOW() WHERE id = $2`, [req.body.paypal, req.params.id]);
        res.status(200).json({
            success: true,
            message: 'Payment successful!'
        });
    }
    catch (e) {
        next((0, http_errors_1.default)(500, e));
    }
    finally {
        client.release();
    }
}));
module.exports = router;
//# sourceMappingURL=order.js.map