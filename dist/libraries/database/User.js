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
exports.User = void 0;
const dotcomcore_1 = __importDefault(require("dotcomcore"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const crypto_1 = __importDefault(require("crypto"));
const argon2_1 = __importDefault(require("argon2"));
const Email_1 = require("./Email");
const DotComUser = dotcomcore_1.default.User;
class User extends DotComUser {
    /**
     * Creates a new user in the database.
     * @param username The name of the new user.
     * @param emailId The email ID of the new user.
     * @param password The password of the new user.
     * @param birthdate The birthdate of the new user.
     * @returns A promise that resolves to a code that indicates the result of the operation.
     */
    static Set(username, emailId, password, birthdate) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield dotcomcore_1.default.Core.Connect();
            try {
                if (!RSEngine_1.RSTime.MinimumAge(birthdate))
                    return User.SignUpCode.NOT_ENOUGH_AGE;
                if (yield User.ExistsByHandler(username))
                    return User.SignUpCode.ALREADY_EXISTS;
                const hash = crypto_1.default.randomBytes(32).toString('hex');
                const pwrd = yield argon2_1.default.hash(password);
                const query = yield client.query(`INSERT INTO
				users (hash, username, _handler, password, birthdate)
				VALUES ($1, $2, $3, $4, $5) RETURNING id`, [
                    hash,
                    username,
                    username,
                    pwrd,
                    birthdate
                ]);
                const email = yield Email_1.Email.GetById(emailId);
                if (!email)
                    return User.SignUpCode.INTERNAL_ERROR;
                const originalEmail = yield email.Read(yield email.GenericCryptoKey());
                const encryptedEmail = yield RSEngine_1.RSCrypto.Encrypt(originalEmail, yield User.GenerateCryptoKey(hash));
                yield client.query(`UPDATE emails SET usrid = $1, email = $2 WHERE id = $3`, [
                    query.rows[0].id,
                    encryptedEmail,
                    emailId
                ]);
                return User.SignUpCode.SUCCESS;
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
exports.User = User;
(function (User) {
    let SignUpCode;
    (function (SignUpCode) {
        SignUpCode[SignUpCode["SUCCESS"] = 0] = "SUCCESS";
        SignUpCode[SignUpCode["INTERNAL_ERROR"] = 1] = "INTERNAL_ERROR";
        SignUpCode[SignUpCode["ALREADY_EXISTS"] = 2] = "ALREADY_EXISTS";
        SignUpCode[SignUpCode["NOT_ENOUGH_AGE"] = 3] = "NOT_ENOUGH_AGE";
    })(SignUpCode = User.SignUpCode || (User.SignUpCode = {}));
})(User = exports.User || (exports.User = {}));
//# sourceMappingURL=User.js.map