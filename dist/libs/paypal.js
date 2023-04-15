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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = exports.capturePayment = exports.createOrder = void 0;
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const conf_1 = __importDefault(require("../conf"));
const globals_1 = require("../globals");
const base = conf_1.default.production ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
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
            const auth = Buffer.from(`${conf_1.default.paypal.id}:${conf_1.default.paypal.secret}`).toString('base64');
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