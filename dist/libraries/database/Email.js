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
exports.Email = void 0;
const dotcomcore_1 = __importDefault(require("dotcomcore"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const User_1 = require("./User");
const DotComEmail = dotcomcore_1.default.Email;
class Email extends DotComEmail {
    // #region Methods to prevent stupid TypeScript errors.
    constructor(email) {
        super(email);
    }
    static GetById(id) {
        const _super = Object.create(null, {
            GetById: { get: () => super.GetById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const email = yield _super.GetById.call(this, id);
            return email ? new Email(email) : null;
        });
    }
    static Get(email) {
        const _super = Object.create(null, {
            Get: { get: () => super.Get }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const emailObj = yield _super.Get.call(this, email);
            return emailObj ? new Email(emailObj) : null;
        });
    }
    // #endregion
    /**
     * Creates a new email address in the database.
     * @param email The email address to add.
     * @param type The type of email address.
     * @param userId The user ID to associate the email address with, if any.
     * @returns A promise that resolves when the email address has been added.
     */
    static Set(email, type = Email.Type.PRIMARY, userId) {
        const _super = Object.create(null, {
            _HMAC: { get: () => super._HMAC }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield dotcomcore_1.default.Core.Connect();
            try {
                const hash = yield _super._HMAC.call(this, email);
                var encryptedEmail;
                // If the user doesn't exist, use the main encryption key.
                if (!userId) {
                    const encryptionKey = yield RSEngine_1.RSCrypto.PBKDF2(dotcomcore_1.default.Core.encryptionKey, hash, 1000, 32);
                    encryptedEmail = yield RSEngine_1.RSCrypto.Encrypt(email, encryptionKey);
                }
                else {
                    // Otherwise, use the user's encryption key.
                    const user = yield User_1.User.GetById(userId);
                    encryptedEmail = yield RSEngine_1.RSCrypto.Encrypt(email, yield user.GetCryptoKey());
                }
                yield client.query(`INSERT INTO emails (hash, email, usrid, refer) VALUES ($1, $2, $3, $4)`, [
                    hash,
                    encryptedEmail,
                    userId || null,
                    type
                ]);
                return;
            }
            catch (e) {
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
    /**
     * Deletes the email address from the database.
     */
    Delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield dotcomcore_1.default.Core.Connect();
            try {
                yield client.query(`DELETE FROM emails WHERE id = $1`, [this.id]);
                return;
            }
            catch (e) {
                throw e;
            }
            finally {
                client.release();
            }
        });
    }
}
exports.Email = Email;
(function (Email) {
    let Type;
    (function (Type) {
        Type[Type["PRIMARY"] = 0] = "PRIMARY";
        Type[Type["CONTACT"] = 1] = "CONTACT";
        Type[Type["SECONDARY"] = 2] = "SECONDARY";
    })(Type = Email.Type || (Email.Type = {}));
})(Email = exports.Email || (exports.Email = {}));
//# sourceMappingURL=Email.js.map