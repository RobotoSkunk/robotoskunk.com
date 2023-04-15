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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSTime = exports.RSCrypto = exports.RSMisc = exports.RSFiles = exports.RSMath = exports.RSRandom = exports.RSError = void 0;
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = __importDefault(require("crypto"));
class RSError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.RSError = RSError;
class RSRandom {
    /**
     * Random Integer
     * @param x The upper range from which the random number will be selected.
     * @returns A random integer number from [0, x];
     */
    static Integer(x) {
        return Math.floor(Math.random() * x);
    }
    /**
     * Random Float
     * @param x The upper range from which the random number will be selected.
     * @returns A random float number from [0, x];
     */
    static Float(x) {
        return Math.random() * x;
    }
    /**
     * Random Integer in a range
     * @param x1 The lower range from which the random number will be selected.
     * @param x2 The upper range from which the random number will be selected.
     * @returns A random integer number from [x1, x2];
     */
    static IntRange(x1, x2) {
        return Math.floor(Math.random() * (x2 - x1) + x1);
    }
    /**
     * Random Float in a range
     * @param x1 The lower range from which the random number will be selected.
     * @param x2 The upper range from which the random number will be selected.
     * @returns A random float number from [x1, x2];
     */
    static FloatRange(x1, x2) {
        return Math.floor(Math.random() * (x2 - x1) + x1);
    }
    /**
     * Choose a random value.
     * @param arr An input value that can be any.
     * @returns The choosen value.
     */
    static Choose(arr) {
        return arr[(RSRandom.Integer(arr.length))];
    }
    /**
     * Wait for a certain amount of time.
     * @param min The minimum amount of time to wait.
     * @param max The maximum amount of time to wait.
     * @returns A promise that will be resolved after the time has passed.
     */
    static Wait(min, max) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                setTimeout(resolve, RSRandom.IntRange(min, max));
            });
        });
    }
    static Shuffle(arr) {
        var j, x, i;
        for (i = arr.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = arr[i];
            arr[i] = arr[j];
            arr[j] = x;
        }
        return arr;
    }
}
exports.RSRandom = RSRandom;
class RSMath {
    /**
     * Mantains a number in a range.
     * @param x The number to clamp.
     * @param min The minimum of the range.
     * @param max The maximum of the range.
     * @returns The clamped number.
     */
    static Clamp(x, min, max) {
        return Math.min(Math.max(x, min), max);
    }
    /**
     * Removes an specific element from an array.
     * @param arr The array where the element is gonna go.
     * @param value The element to remove.
     * @returns The modified array.
     */
    static ArrayRemove(arr, value) {
        return arr.filter(function (ele) {
            return ele != value;
        });
    }
}
exports.RSMath = RSMath;
class RSFiles {
    /**
     * Checks if a file exists.
     * @param filePath The file path to check.
     * @returns True or false if the file exists or not.
     */
    static Exists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            var toReturn = true;
            fs_1.default.access(filePath, fs_1.default.constants.F_OK, (err) => {
                if (err)
                    toReturn = false;
            });
            return new Promise((resolve, reject) => {
                resolve(toReturn);
            });
        });
    }
    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.
     * @param filePath The file path to write.
     * @param data The data to write in.
     * @returns True or false if the writing fails.
     */
    static Write(filePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield promises_1.default.writeFile(filePath, data);
                    return resolve(true);
                }
                catch (err) {
                    return reject(err);
                }
                resolve(false);
            }));
        });
    }
    /**
     * Asynchronously reads the entire contents of a file.
     * @param filePath The file path to read.
     * @returns The file data if success or null if it fails.
     */
    static Read(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (yield RSFiles.Exists(filePath)) {
                    try {
                        const data = yield promises_1.default.readFile(filePath, 'utf-8');
                        resolve(data);
                    }
                    catch (err) {
                        return resolve(null);
                    }
                }
                else {
                    resolve(null);
                }
            }));
        });
    }
}
exports.RSFiles = RSFiles;
class RSMisc {
    /**
     * Makes the program sleep for some miliseconds.
     * @param ms The time to wait.
     * @returns Your mom.
     */
    static Sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    /**
     * Encodes an ascii string to base64.
     * @param text The text to be converted to.
     * @returns The string encoded in base64.
     */
    static ToBase64(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return Buffer.from(text, 'utf8').toString('base64');
        });
    }
    /**
     * Decodes an ascii string to base64.
     * @param text The text to be converted to.
     * @returns The string decoded from base64.
     */
    static FromBase64(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return Buffer.from(text, 'base64').toString('utf8');
        });
    }
    /**
     * Encodes a string to base64 url safe.
     * @param text The text to be converted to.
     * @returns The string encoded in base64 url safe.
     */
    static ToBase64Url(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return Buffer.from(text, 'utf8').toString('base64url');
        });
    }
    /**
     * Decodes a string from base64 url safe.
     * @param text The text to be converted to.
     * @returns The string decoded from base64 url safe.
     */
    static FromBase64Url(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return Buffer.from(text, 'base64url').toString('utf8');
        });
    }
    /**
     * Escapes all html special characters in a string.
     * @param text The text to be converted to.
     * @returns The string with escaped html special characters.
     */
    static EscapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    /**
     * Separates a number with commas.
     * @param x The number to be separated.
     * @returns The separated number.
     */
    static NumberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    /**
     * Translates ms time to spanish.
     * @param ms The time to be translated.
     * @returns The translated time.
     */
    static TranslateTime(ms) {
        const words = {
            'second': 'segundo', 'seconds': 'segundos',
            'minute': 'minuto', 'minutes': 'minutos',
            'hour': 'hora', 'hours': 'horas',
            'day': 'día', 'days': 'días',
            'week': 'semana', 'weeks': 'semanas',
            'month': 'mes', 'months': 'meses',
            'year': 'año', 'years': 'años'
        };
        for (const word in words) {
            if (ms.includes(word))
                return `${ms.replace(word, words[word])}`;
        }
        return ms;
    }
    static AnonymizeAgent(userAgent) {
        return userAgent
            .replace(/( \[FB(.*))$/g, '')
            .replace(/( V1_AND_(.*))$/g, '')
            .replace(/\/(\d+\.?)+/g, (match, p1) => { return match.split('.').map((v, i) => i === 0 ? v : '0').join('.'); });
    }
    static VerifyCaptcha(token, secret) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield fetch(`https://hcaptcha.com/siteverify`, {
                    method: 'POST',
                    body: new URLSearchParams({ 'secret': secret, 'response': token })
                });
                if (res.ok) {
                    const json = yield res.json();
                    return json.success;
                }
            }
            catch (_) { }
            return false;
        });
    }
    static EnumKey(obj, value) {
        for (const key in obj) {
            if (obj[key] === value)
                return key;
        }
        return null;
    }
    static ValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch (_) { }
        return false;
    }
}
exports.RSMisc = RSMisc;
class RSCrypto {
    /**
     * Hashes a string using SHA256.
     * @param data The string to hash.
     * @returns The hashed string.
     */
    static Hash(data) {
        try {
            return crypto_1.default.createHash(this.algo).update(data).digest('hex');
        }
        catch (e) {
            throw new RSError(e.message, -1);
        }
    }
    /**
     * Compares two strings safely.
     * @param a The first string.
     * @param b The second string.
     * @returns True or false if the strings are equal.
     */
    static Compare(a, b) {
        if (a.length !== b.length)
            return false;
        var result = 0;
        for (var i = 0; i < a.length; i++)
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        return result === 0;
    }
    /**
     * Generates a random bytes string encoded in base64 url safe.
     * @param length The length of the random bytes.
     * @returns The random bytes string encoded in base64 url safe.
     */
    static RandomBytes(length) { return crypto_1.default.randomBytes(length).toString('base64url'); }
    static Encrypt(data, key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const sha256 = crypto_1.default.createHash(this.algo);
                    sha256.update(key);
                    const iv = crypto_1.default.randomBytes(16);
                    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', sha256.digest(), iv);
                    const ciphertext = cipher.update(Buffer.from(data));
                    resolve(Buffer.concat([iv, ciphertext, cipher.final(), cipher.getAuthTag()]).toString('base64'));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    static Decrypt(data, key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const sha256 = crypto_1.default.createHash(this.algo);
                    sha256.update(key);
                    const dataBuffer = Buffer.from(data, 'base64');
                    const iv = dataBuffer.subarray(0, 16);
                    const authTag = dataBuffer.subarray(dataBuffer.length - 16);
                    const ciphertext = dataBuffer.subarray(16, dataBuffer.length - 16);
                    const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', sha256.digest(), iv);
                    decipher.setAuthTag(authTag);
                    const plaintext = decipher.update(ciphertext);
                    resolve(Buffer.concat([plaintext, decipher.final()]).toString());
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
    static HMAC(data, key) {
        return crypto_1.default.createHmac('sha256', key).update(data).digest('hex');
    }
    static PBKDF2(data, salt, iterations, keylen) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                crypto_1.default.pbkdf2(data, salt, iterations, keylen, 'sha256', (err, derivedKey) => {
                    if (err)
                        reject(err);
                    else
                        resolve(derivedKey.toString('hex'));
                });
            });
        });
    }
}
RSCrypto.algo = 'sha256';
exports.RSCrypto = RSCrypto;
class RSTime {
    static get _SECOND_() { return this.s; }
    static get _MINUTE_() { return this.m; }
    static get _HOUR_() { return this.h; }
    static get _DAY_() { return this.d; }
    static get _WEEK_() { return this.w; }
    static get _MONTH_() { return this.M; }
    static get _YEAR_() { return this.y; }
    static ToString(ms, lang = 'en') {
        var langData = this.langs[lang];
        if (!langData)
            langData = this.langs.en;
        const t = Math.abs(ms);
        if (t >= this.y)
            return `${Math.round(t / this.y)} ${langData.y[+(t >= this.y * 2)]}`;
        if (t >= this.M)
            return `${Math.round(t / this.M)} ${langData.M[+(t >= this.M * 2)]}`;
        if (t >= this.w)
            return `${Math.round(t / this.w)} ${langData.w[+(t >= this.w * 2)]}`;
        if (t >= this.d)
            return `${Math.round(t / this.d)} ${langData.d[+(t >= this.d * 2)]}`;
        if (t >= this.h)
            return `${Math.round(t / this.h)} ${langData.h[+(t >= this.h * 2)]}`;
        if (t >= this.m)
            return `${Math.round(t / this.m)} ${langData.m[+(t >= this.m * 2)]}`;
        if (t >= this.s)
            return `${Math.round(t / this.s)} ${langData.s[+(t >= this.s * 2)]}`;
        return langData.n;
    }
    static Relative(date, lang = 'en') {
        return RSTime.ToString(Date.now() - date.getTime(), lang);
    }
    static RelativeAgo(date, lang = 'en') {
        const __tmp = RSTime.Relative(date, lang);
        if (__tmp === this.langs[lang].n)
            return __tmp;
        return this.langs[lang].ago.replace('$', __tmp);
    }
    static SetTimezone(date, GTM) {
        return new Date(date.getTime() + GTM * 60 * 60 * 1000);
    }
    static MinimumAge(birthdate) {
        return Date.now() - birthdate.getTime() >= this.y * 13;
    }
    /**
     * Returns the age of the user in years, but anonymously.
     * @param birthdate The birthdate of the user.
     */
    static KAnonAge(birthdate) {
        const age = ~~((Date.now() - birthdate.getTime()) / this.y);
        if (age < 16)
            return RSRandom.IntRange(8, 15);
        if (age < 18)
            return RSRandom.Choose([16, 17]);
        if (age < 30)
            return RSRandom.IntRange(18, 29);
        return RSRandom.IntRange(30, 50);
    }
}
_a = RSTime;
RSTime.s = 1000;
RSTime.m = _a.s * 60;
RSTime.h = _a.m * 60;
RSTime.d = _a.h * 24;
RSTime.w = _a.d * 7;
RSTime.M = _a.d * 30;
RSTime.y = _a.d * 365;
RSTime.langs = {
    en: {
        n: 'now',
        s: ['second', 'seconds'],
        m: ['minute', 'minutes'],
        h: ['hour', 'hours'],
        d: ['day', 'days'],
        w: ['week', 'weeks'],
        M: ['month', 'months'],
        y: ['year', 'years'],
        ago: '$ ago'
    },
    es: {
        n: 'ahora',
        s: ['segundo', 'segundos'],
        m: ['minuto', 'minutos'],
        h: ['hora', 'horas'],
        d: ['día', 'días'],
        w: ['semana', 'semanas'],
        M: ['mes', 'meses'],
        y: ['año', 'años'],
        ago: 'hace $'
    },
    fr: {
        n: 'maintenant',
        s: ['seconde', 'secondes'],
        m: ['minute', 'minutes'],
        h: ['heure', 'heures'],
        d: ['jour', 'jours'],
        w: ['semaine', 'semaines'],
        M: ['mois', 'mois'],
        y: ['an', 'ans'],
        ago: 'il y a $'
    },
    pt: {
        n: 'agora',
        s: ['segundo', 'segundos'],
        m: ['minuto', 'minutos'],
        h: ['hora', 'horas'],
        d: ['dia', 'dias'],
        w: ['semana', 'semanas'],
        M: ['mês', 'meses'],
        y: ['ano', 'anos'],
        ago: 'há $'
    }
};
exports.RSTime = RSTime;
(function (RSTime) {
    let MONTH_INDEX;
    (function (MONTH_INDEX) {
        MONTH_INDEX[MONTH_INDEX["JANUARY"] = 0] = "JANUARY";
        MONTH_INDEX[MONTH_INDEX["FEBRUARY"] = 1] = "FEBRUARY";
        MONTH_INDEX[MONTH_INDEX["MARCH"] = 2] = "MARCH";
        MONTH_INDEX[MONTH_INDEX["APRIL"] = 3] = "APRIL";
        MONTH_INDEX[MONTH_INDEX["MAY"] = 4] = "MAY";
        MONTH_INDEX[MONTH_INDEX["JUNE"] = 5] = "JUNE";
        MONTH_INDEX[MONTH_INDEX["JULY"] = 6] = "JULY";
        MONTH_INDEX[MONTH_INDEX["AUGUST"] = 7] = "AUGUST";
        MONTH_INDEX[MONTH_INDEX["SEPTEMBER"] = 8] = "SEPTEMBER";
        MONTH_INDEX[MONTH_INDEX["OCTOBER"] = 9] = "OCTOBER";
        MONTH_INDEX[MONTH_INDEX["NOVEMBER"] = 10] = "NOVEMBER";
        MONTH_INDEX[MONTH_INDEX["DECEMBER"] = 11] = "DECEMBER";
    })(MONTH_INDEX = RSTime.MONTH_INDEX || (RSTime.MONTH_INDEX = {}));
})(RSTime = exports.RSTime || (exports.RSTime = {}));
exports.RSTime = RSTime;
//# sourceMappingURL=RSEngine.js.map