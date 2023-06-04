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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = exports.capturePayment = exports.createOrder = void 0;
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const env_1 = __importDefault(require("../env"));
const globals_1 = require("../globals");
const base = env_1.default.production ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
function createOrder(price) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accessToken = yield generateAccessToken();
            if (!accessToken)
                return null;
            const response = yield fetch(`${base}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: (0, safe_stable_stringify_1.default)({
                    intent: 'CAPTURE',
                    purchase_units: [{
                            amount: {
                                currency_code: 'USD',
                                value: price.toString()
                            }
                        }]
                })
            });
            return yield response.json();
        }
        catch (e) {
            globals_1.logger.error(e);
        }
        return null;
    });
}
exports.createOrder = createOrder;
function capturePayment(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accessToken = yield generateAccessToken();
            if (!accessToken)
                return null;
            const response = yield fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: '{}'
            });
            return handleResponse(response);
        }
        catch (e) {
            globals_1.logger.error(e);
        }
        return null;
    });
}
exports.capturePayment = capturePayment;
function generateAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const auth = Buffer.from(`${env_1.default.paypal.id}:${env_1.default.paypal.secret}`).toString('base64');
            const response = yield fetch(`${base}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`,
                    'Accept-Encoding': ''
                },
                body: 'grant_type=client_credentials'
            });
            const jsonData = yield handleResponse(response);
            if (!jsonData)
                return null;
            return jsonData.access_token;
        }
        catch (e) {
            globals_1.logger.error(e);
        }
        return null;
    });
}
exports.generateAccessToken = generateAccessToken;
function handleResponse(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.status >= 200 && response.status < 300)
            return yield response.json();
        globals_1.logger.error(yield response.json());
        return null;
    });
}
//# sourceMappingURL=paypal.js.map