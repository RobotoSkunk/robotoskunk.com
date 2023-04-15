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
exports.zxcvbn = exports.haveIBeenPwned = void 0;
const crypto_1 = __importDefault(require("crypto"));
const RSEngine_1 = require("../libs/RSEngine");
const core_1 = require("@zxcvbn-ts/core");
Object.defineProperty(exports, "zxcvbn", { enumerable: true, get: function () { return core_1.zxcvbn; } });
const language_common_1 = __importDefault(require("@zxcvbn-ts/language-common"));
const language_en_1 = __importDefault(require("@zxcvbn-ts/language-en"));
const language_es_es_1 = __importDefault(require("@zxcvbn-ts/language-es-es"));
const language_fr_1 = __importDefault(require("@zxcvbn-ts/language-fr"));
const language_pt_br_1 = __importDefault(require("@zxcvbn-ts/language-pt-br"));
core_1.zxcvbnOptions.setOptions({
    'translations': language_en_1.default.translations,
    'graphs': language_common_1.default.adjacencyGraphs,
    'dictionary': Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, language_common_1.default.dictionary), language_en_1.default.dictionary), language_es_es_1.default.dictionary), language_fr_1.default.dictionary), language_pt_br_1.default.dictionary)
});
/**
 * Sends a request to haveibeenpwned.com to check if a password was exposed by a data breach.
 * @param password The password to check.
 * @returns A promise that resolves to true if the password was exposed by a data breach.
 */
function haveIBeenPwned(password) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                var pwned = null;
                // deepcode ignore InsecureHash: This is obligatory from the HaveIBeenPwned API
                const hash = crypto_1.default.createHash('sha1').update(password).digest('hex').toUpperCase();
                const response = yield fetch(`https://api.pwnedpasswords.com/range/${encodeURIComponent(hash.substring(0, 5))}`);
                if (response.ok) {
                    const data = yield response.text();
                    pwned = data.split('\r\n').find((line) => RSEngine_1.RSCrypto.Compare(line.split(':')[0], hash.substring(5)));
                }
                resolve(pwned);
            }
            catch (e) {
                reject(e);
            }
        }));
    });
}
exports.haveIBeenPwned = haveIBeenPwned;
//# sourceMappingURL=zxcvbn.js.map