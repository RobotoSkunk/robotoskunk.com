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
exports.MailQueue = void 0;
const ejs_1 = __importDefault(require("ejs"));
const dotcomcore_1 = __importDefault(require("dotcomcore"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../logger");
const crypto_1 = __importDefault(require("crypto"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
/**
 * Controls the flow of the sent emails.
 */
class MailQueue {
    static GenerateCryptoKey(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield RSEngine_1.RSCrypto.PBKDF2(process.env.MASTER_KEY, hash, 1000, 32);
        });
    }
    /**
     * Sends a new email to the queue.
     * @param email The email address to send the email to.
     * @param subject The subject of the email.
     * @param body The body of the email.
     */
    static SendEmail(email, subject, body) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the website is in development mode, don't send the email.
            // Instead use a test account from ethereal.email.
            if (process.env.NODE_ENV === 'development') {
                try {
                    // If the account hasn't been created yet, create it.
                    if (!MailQueue.transporter) {
                        const testAccount = yield nodemailer_1.default.createTestAccount();
                        MailQueue.transporter = nodemailer_1.default.createTransport({
                            host: testAccount.smtp.host,
                            port: testAccount.smtp.port,
                            secure: testAccount.smtp.secure,
                            auth: {
                                user: testAccount.user,
                                pass: testAccount.pass
                            }
                        });
                    }
                    // Send the email.
                    // Don't use await here because it will slow down the response time.
                    MailQueue.transporter.sendMail({
                        from: `"RobotoSkunk" <${process.env.EMAIL_AUTH_USER}>`,
                        to: email,
                        subject: subject,
                        html: body
                    }).then((info) => {
                        console.log('Preview URL: %s', nodemailer_1.default.getTestMessageUrl(info));
                    }).catch((e) => {
                        console.error(e);
                    });
                }
                catch (e) {
                    console.error(e);
                }
                return;
            }
            const client = yield dotcomcore_1.default.Core.Connect();
            try {
                const id = crypto_1.default.randomBytes(16).toString('base64url');
                const hash = crypto_1.default.randomBytes(32).toString('hex');
                const cryptoKey = yield MailQueue.GenerateCryptoKey(hash);
                const encryptedEmail = yield RSEngine_1.RSCrypto.Encrypt(email, cryptoKey);
                const encryptedBody = yield RSEngine_1.RSCrypto.Encrypt(body, cryptoKey);
                yield client.query(`INSERT INTO
				mail_queue (id, hash, _to, subject, body)
				VALUES ($1, $2, $3, $4, $5)`, [
                    id,
                    hash,
                    encryptedEmail,
                    subject,
                    encryptedBody
                ]);
            }
            catch (e) {
                logger_1.logger.error(e);
            }
            finally {
                client.release();
            }
        });
    }
    static GenerateTemplate(template, recipient, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = Object.assign({}, data, {
                websiteDomain: MailQueue.websiteDomain,
                recipient: recipient,
                contactEmail: MailQueue.contactEmail
            });
            const _body = yield ejs_1.default.renderFile(`layouts/utils/mailer/${template}.ejs`, options);
            return yield ejs_1.default.renderFile(`layouts/utils/mailer/template.ejs`, {
                body: _body,
                recipient: recipient,
                websiteDomain: MailQueue.websiteDomain,
                contactEmail: MailQueue.contactEmail
            });
        });
    }
}
exports.MailQueue = MailQueue;
//# sourceMappingURL=MailQueue.js.map