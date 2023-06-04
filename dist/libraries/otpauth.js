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