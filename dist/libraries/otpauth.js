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
exports.OTPAuth = void 0;
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
otplib_1.authenticator.options = {
    window: [1, 1]
};
class OTPAuth {
    constructor(secret, account = 'anonymous') {
        this.secret = secret;
        this.account = account;
    }
    static genSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    resolve(otplib_1.authenticator.generateSecret());
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    getUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    resolve(otplib_1.authenticator.keyuri(this.account, 'robotoskunk.com', this.secret));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    getQR() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = yield this.getUrl();
            return yield qrcode_1.default.toDataURL(url, { 'width': 256 });
        });
    }
    check(code) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    resolve(otplib_1.authenticator.check(code, this.secret));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.OTPAuth = OTPAuth;
//# sourceMappingURL=otpauth.js.map