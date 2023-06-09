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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueue = void 0;
const dotcomcore_1 = __importStar(require("dotcomcore"));
const Email_1 = require("../Email");
class EmailQueue extends dotcomcore_1.TokenBase {
    // #region Methods to prevent stupid TypeScript errors.
    constructor(id, validator, createdAt, expiresAt) {
        super(id, validator, createdAt, expiresAt);
    }
    static GetToken(token) {
        const _super = Object.create(null, {
            GetToken: { get: () => super.GetToken }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const _token = yield _super.GetToken.call(this, token);
            return _token ? new EmailQueue(_token.id, _token.validator, _token.createdAt, _token.expiresAt) : null;
        });
    }
    // #endregion
    /**
     * Gets the email of a token.
     */
    GetEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield dotcomcore_1.default.Core.Connect();
            try {
                const query = yield client.query(`SELECT eid FROM verify_email_queue WHERE id = $1`, [this.id]);
                const emailId = query.rows[0].eid;
                const email = yield Email_1.Email.GetById(emailId);
                return email;
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
     * Adds a new email token to the database.
     * @param email The email to associate with the token.
     * @returns The new generated token.
     */
    static Add(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield dotcomcore_1.default.Core.Connect();
            try {
                const token = dotcomcore_1.TokenBase.GenerateToken();
                const query = yield client.query(`INSERT INTO
				verify_email_queue (id, val_key, eid)
				VALUES ($1, $2, $3)
				RETURNING created_at, expires_at`, [
                    token.id,
                    token.validator,
                    email.id
                ]);
                token.createdAt = query.rows[0].created_at;
                token.expiresAt = query.rows[0].expires_at;
                token.emailId = email.id;
                return token;
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
exports.EmailQueue = EmailQueue;
//# sourceMappingURL=EmailQueue.js.map