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
exports.EmailQueue = void 0;
const dotcomcore_1 = __importDefault(require("dotcomcore"));
const Email_1 = require("../Email");
const TokenBase = dotcomcore_1.default.TokenBase;
class EmailQueue extends TokenBase {
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
}
exports.EmailQueue = EmailQueue;
//# sourceMappingURL=EmailQueue.js.map