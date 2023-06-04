"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const RSEngine_1 = require("dotcomcore/dist/RSEngine");
const lang_1 = require("./libraries/lang");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_errors_1 = __importDefault(require("http-errors"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const recursive_routing_1 = __importDefault(require("recursive-routing"));
const useragent = __importStar(require("express-useragent"));
const minify_1 = require("./libraries/minify");
const rateLimiter_1 = require("./libraries/rateLimiter");
const ejs_1 = __importDefault(require("ejs"));
const express_1 = __importDefault(require("express"));
const globals_1 = require("./globals");
const db_1 = require("./libraries/db");
const db_utils_1 = require("./libraries/db-utils");
const __staticFiles = './static-http';
const app = (0, express_1.default)();
//// These comments bellow are used by DeepCode to ignore some false positives
// file deepcode ignore UseCsurfForExpress: UserToken.GenerateCSRF() and UserToken.ValidateCSRF() are used to prevent CSRF attacks.
// file deepcode ignore WebCookieHttpOnlyDisabledByDefault: UserToken.GetCookieParams() already sets the HttpOnly flag
// file deepcode ignore WebCookieSecureDisabledByDefault: UserToken.GetCookieParams() already sets the Secure flag
(() => __awaiter(void 0, void 0, void 0, function* () {
    app.engine('ejs', (path, options, cb) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            var html = yield ejs_1.default.renderFile(path, options);
            html = `${RSEngine_1.RSRandom.Choose(globals_1.phrases)}\n\n${html}`;
            cb(null, html);
        }
        catch (e) {
            cb(e);
        }
    }));
    app.set('etag', false);
    app.set('views', './layouts');
    app.set('view engine', 'ejs');
    app.set('view cache', globals_1.env.production);
    app.set('x-powered-by', false);
    app.set('case sensitive routing', true);
    app.set('trust proxy', true);
    app.use(express_1.default.json({
        'type': [
            'application/json',
            'application/csp-report',
            'application/reports+json'
        ]
    }));
    app.use(express_1.default.urlencoded({ 'extended': true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, compression_1.default)());
    app.use(useragent.express());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)({ 'crossOriginEmbedderPolicy': false }));
    app.use((0, morgan_1.default)('tiny', {
        'stream': globals_1.loggerStream,
        'skip': (req, res) => res.statusCode < 500 && res.statusCode !== 429
    }));
    if (!globals_1.env.production) {
        app.use((0, morgan_1.default)('dev', { 'stream': globals_1.loggerStream }));
    }
    app.use(yield (0, minify_1.minify)());
    globals_1.logger.info('###############################################################################');
    // Headers, security and server info
    app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const nonce = crypto_1.default.randomBytes(24).toString('base64url');
        const today = new Date();
        const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
        const onlyUrl = url.split('?')[0];
        const authToken = req.cookies.auth_token || '';
        const lang = (0, lang_1.getCode)(req.cookies.lang || req.headers['accept-language'] || 'en');
        var tokenData;
        const root = `${req.protocol}://${req.hostname}`;
        const isOnion = req.hostname.endsWith('.onion');
        res.rs = {
            'env': globals_1.env,
            'server': {
                'dateYear': today.getFullYear(),
                'nonce': nonce,
                'url': url,
                'onlyUrl': onlyUrl,
                'aEnabled': true
            },
            'html': {
                'meta': {
                    'title': 'RobotoSkunk',
                    'description': "I'm a general purpose developer who creates commissioned artwork and games."
                        + "I'm currently working on a game called 'PixelMan Adventures' and an API for this website.",
                    'img': `${root}/resources/img/meta-icon.webp`,
                    'setSubtitle': (subtitle) => {
                        res.rs.html.meta.title = `${subtitle} - RobotoSkunk`;
                    }
                }
            },
            'client': {
                'lang': lang,
                'authToken': authToken,
                'token': () => __awaiter(void 0, void 0, void 0, function* () {
                    if (tokenData)
                        return tokenData;
                    const tokenResponse = yield db_1.UserToken.Auth(authToken, req.useragent.source);
                    if (tokenResponse) {
                        if (tokenResponse.updated) {
                            res.cookie('auth_token', tokenResponse.text, tokenResponse.token.GetCookieParams(isOnion));
                        }
                    }
                    tokenData = tokenResponse;
                    return tokenResponse;
                }),
                'isOnion': isOnion
            }
        };
        res.minifyOptions = res.minifyOptions || {};
        res.isApi = req.path.startsWith('/api/') || req.path.startsWith('/oauth/');
        res.rs.env.root = root;
        res.renderDefault = (view = 'layout.ejs', options = {}) => __awaiter(void 0, void 0, void 0, function* () {
            options = Object.assign({
                checkBannedUser: true,
                useZxcvbn: false,
                analyticsEnabled: true,
                checkIfUserHasBirthdate: true
            }, options);
            if (options.useZxcvbn) {
                const zxcvbn = yield ejs_1.default.renderFile(path_1.default.join(process.cwd(), '/layouts/utils/zxcvbn.ejs'), {
                    nonce: res.rs.server.nonce,
                    version: res.rs.env.version
                });
                res.rs.html.head = `${zxcvbn}\n\n${res.rs.html.head}`;
            }
            res.locals = Object.assign(res.rs, options.locals || {});
            const tokenResponse = yield res.rs.client.token();
            var user;
            if (tokenResponse)
                user = res.locals.user = yield tokenResponse.token.GetUser();
            if (tokenResponse) {
                if (options.denyIfLoggedIn) {
                    next((0, http_errors_1.default)(403, 'You are already logged in.'));
                    return;
                }
                if (options.checkBannedUser) {
                    if (((yield user.CheckBlacklist()) & db_utils_1.Blacklist.FLAGS.BANNED) === db_utils_1.Blacklist.FLAGS.BANNED) {
                        res.redirect('/banned');
                        return;
                    }
                }
                if (options.checkIfUserHasBirthdate) {
                    if (!user.birthdate) {
                        res.redirect('/accounts/settings/birthdate');
                        return;
                    }
                }
            }
            res.render(view, res.locals);
        });
        res.getEJSPath = (_path) => {
            return path_1.default.join(process.cwd(), 'layouts/static', _path);
        };
        res.header('Content-Security-Policy', `default-src 'self' 'unsafe-hashes' 'unsafe-inline' ${!globals_1.env.production ? 'localhost:*' : ''}`
            + ` www.redbubble.com *.robotoskunk.com robotoskunk.com www.youtube.com *.paypal.com *.facebook.com`
            + ` ko-fi.com *.ko-fi.com cdnjs.cloudflare.com api.pwnedpasswords.com js.hcaptcha.com *.hcaptcha.com`
            + ` translate.googleapis.com;`
            + `script-src 'strict-dynamic' 'unsafe-inline' https: ${!globals_1.env.production || isOnion ? 'http:' : ''}`
            + ` 'nonce-${nonce}';`
            + `base-uri 'self';`
            + `object-src 'none';`
            + `img-src 'self' data: *.robotoskunk.com robotoskunk.com *.paypalobjects.com *.paypal.com`
            + ` *.sandbox.paypal.com cdn.discord.com imgur.com giphy.com *.imgur.com *.giphy.com i.ytimg.com`
            + ` ko-fi.com *.ko-fi.com cdn.jsdelivr.net www.gstatic.com www.google.com translate.googleapis.com`
            + ` *.googleusercontent.com drive.google.com;`
            + 'report-uri /csp-report;'
            + (isOnion ? '' : 'upgrade-insecure-requests;'));
        res.header('X-UA-Compatible', 'IE=Edge');
        res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains;');
        res.header('X-Frame-Options', 'sameorigin');
        res.header('X-XSS-Protection', '0; mode=block');
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.header('Feature-Policy', "microphone 'none'; geolocation 'none'; camera 'none';");
        res.header('Keep-Alive', 'timeout=5');
        // res.header('Server', 'RobotoSkunk Server');
        res.header('X-Powered-By', 'Your mom');
        next();
    }));
    app.use(rateLimiter_1.rateLimiterMiddleware);
    // #region Routing
    app.use(express_1.default.static(__staticFiles, {
        maxAge: globals_1.env.production ? '1y' : 0,
        dotfiles: 'ignore',
        fallthrough: true,
        etag: true
    }));
    app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        res.header('Cache-Control', 'no-cache');
        next();
    }));
    try {
        (0, recursive_routing_1.default)(app, {
            keepIndex: true,
            rootDir: './dist/routes',
            filter: (f) => {
                if (f.endsWith('.map.js'))
                    return false;
                return f.endsWith('.js');
            }
        });
    }
    catch (e) {
        globals_1.logger.error(e);
    }
    app.get(['/phpmyadmin', '/myadmin', '/phpmyadmin/*', '/myadmin/*'], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const redirects = [
            'https://www.youtube.com/watch?v=hiRacdl02w4&t=46s',
            'https://www.youtube.com/watch?v=wAMZ6KpMGQI',
            'https://www.youtube.com/watch?v=VZzSBv6tXMw',
            'https://www.youtube.com/watch?v=MobkO51msMI',
            'https://www.youtube.com/watch?v=vX-PsnRXWX8',
            'https://www.youtube.com/watch?v=5ANKM2JnZYo',
            'https://www.youtube.com/watch?v=DmH6YPWhaDY',
            'https://www.youtube.com/watch?v=ftYwX5hn7dY',
            'https://www.youtube.com/watch?v=jeg_TJvkSjg',
            'https://www.youtube.com/watch?v=AdF2uk-EscE',
            'https://www.youtube.com/watch?v=XC_T5mvuguw',
            'https://www.youtube.com/watch?v=WfYyBp4Ln2s',
            'https://www.youtube.com/watch?v=Hw1ncADC9KM',
            'https://www.youtube.com/watch?v=FR7wOGyAzpw&t=85s',
            'https://www.youtube.com/watch?v=srZdDAJbHfc&t=10471s',
            'https://www.youtube.com/watch?v=m7EhR8wOVxg',
            'https://www.youtube.com/watch?v=hzVm_Cdcsew',
            'https://www.youtube.com/watch?v=rF-O6Z3sk8c',
            'https://www.youtube.com/watch?v=oIkhgagvrjI',
            'https://www.youtube.com/watch?v=MLsbc-dFWS8'
        ];
        res.redirect(RSEngine_1.RSRandom.Choose(redirects));
    }));
    app.get('/teapot', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        next((0, http_errors_1.default)(418, "I'm a teapot"));
    }));
    if (!globals_1.env.production) {
        app.get('/error/:number', (req, res, next) => {
            const err = Number.parseInt(req.params.number);
            if (err < 400)
                return next((0, http_errors_1.default)(400, 'Invalid error code'));
            next((0, http_errors_1.default)(err, 'This is a bug example'));
        });
        app.get('/roles', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            const bitmask = db_utils_1.UserRoles.FLAGS;
            const roles = Object.keys(bitmask).map((key) => {
                if (isNaN(parseInt(key)))
                    return;
                const id = crypto_1.default.randomBytes(8).toString('base64url');
                return `<input type="checkbox" name="roles" value="${key}" id="${id}">`
                    + `<label for="${id}">${bitmask[key]}</label><br>`;
            }).filter(Boolean);
            var result = '';
            if (req.query.roles) {
                if (!Array.isArray(req.query.roles)) {
                    result = `<p>Result: ${req.query.roles}</p>`;
                }
                else {
                    const roles = req.query.roles.map((r) => parseInt(r));
                    var r = 0;
                    for (const role of roles)
                        r |= role;
                    result = `<p>Result: ${r}</p>`;
                }
            }
            // file deepcode ignore XSS: <form> is not user input
            res.send(`${result}<form method="GET">${roles.join('')}<button>Submit</button></form>`);
        }));
        app.get('/email-test', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            const code = crypto_1.default.randomInt(999999).toString().padStart(6, '0');
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                yield db_1.mailer.Send('supermj@live.com.mx', 'Your 2FA code', `<h2>Sign in to your account</h2>
						<p>
							Hi!, we received a request to sign in to your account.
							If it wasn't you, you might want to change your password.
						</p>
						<p>Your code is:
						<center><h1>${code}</h1></center>

						<p>This code expires in 5 minutes.<b>Don't share this code with anyone.</b></p>`);
            }), 1500);
            res.status(200).send('OK');
        }));
    }
    // #endregion
    // #region Error Handling
    function HandleErrors(err, req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const code = err.statusCode || 500, generic = (0, http_errors_1.default)(code);
            if (code < 400) {
                next();
                return;
            }
            res.rs.html.meta.title = `Error ${code} (${generic.message})`;
            res.rs.error = {
                'code': '' + code,
                'message': 'Something went wrong.',
                'imgPath': '/resources/svg/alex-skunk/dizzy.svg',
                'imgAlt': 'Alex Skunk dizzy on the floor',
                'debug': (globals_1.env.production ?
                    undefined
                    :
                        (err.message ? err.message.replace(/\\/gm, '\\\\').replace(/\`/gm, '\\`') : undefined)),
            };
            switch (code) {
                case 400:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        'Bad request.',
                        "I can't interpret that.",
                        'What kind of request is that?',
                        'This request is very confusing.'
                    ]);
                    break;
                case 401:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        "You must authenticate.",
                        "Authentication missing.",
                        "You haven't authenticated.",
                        "Authentication required."
                    ]);
                    break;
                case 403:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        "You can't be here.",
                        "Get out of here.",
                        "You don't have permissions to be here.",
                        "Access denied.",
                        "Why you're here?",
                        "Stop! You can't be here.",
                        "Forbidden.",
                        "403 means that you can't be here.",
                        "You don't have permission to access.",
                        "If you think you can be here... nope, you can't."
                    ]);
                    break;
                case 404:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        "What you are looking for was not found.",
                        "Are you lost?",
                        "That page doesn't exists.",
                        "What? What was you doing?",
                        "Oops! Something is broken.",
                        "Oh dear, this link isn't working.",
                        "Page lost.",
                        "The page you though exists... doesn't.",
                        "I think you know what 404 means...",
                        "Uhhhh......",
                        "What are you wanting for?"
                    ]);
                    res.rs.error.imgPath = '/resources/svg/alex-skunk/lost.svg';
                    res.rs.error.imgAlt = 'Alex Skunk lost';
                    break;
                case 408:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        "Request timed out.",
                        "Request took too long.",
                        "Request took too long to respond.",
                        "Request took too long to process."
                    ]);
                    res.rs.error.imgPath = '/resources/svg/alex-skunk/slow.svg';
                    res.rs.error.imgAlt = 'Alex Skunk watching a snail';
                    break;
                case 418:
                    res.rs.error.message = "I won't try to make coffee, I'm a teapot!";
                    res.rs.html.meta.title += ' n.n';
                    res.rs.error.imgPath = '/resources/svg/alex-skunk/teapot.svg';
                    res.rs.error.imgAlt = 'Alex Skunk with a teapot costume';
                    break;
                case 429:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        "You're doing that too much.",
                        "You're doing that too fast.",
                        "You're doing that too often.",
                        "You're doing that too much, too fast, too often.",
                        'Slow down.',
                        'Woah! Slow down cowboy!',
                        'Dude, slow down!', 'Too many requests!',
                        'Slow down buddy!'
                    ]);
                    break;
                case 500:
                    res.rs.error.message = RSEngine_1.RSRandom.Choose([
                        "Beep boop... beeeeep...... boop...",
                        "Something went wrong...",
                        "Server error.",
                        "Oops! Something went wrong.",
                        "This is not your fault.",
                        "Oh oh...",
                        "The server is not working."
                    ]);
                    break;
            }
            res.rs.html.meta.description = res.rs.error.message;
            if (code >= 500)
                globals_1.logger.error(`${code} - ${err.message} (${res.rs.server.url})`);
            else if (!globals_1.env.production)
                globals_1.logger.warn(`${code} - ${err.message} (${res.rs.server.url})`);
            res.status(code);
            yield res.renderDefault('layout-http-error.ejs', {
                checkBannedUser: false,
                checkIfUserHasBirthdate: false
            });
        });
    }
    app.use((req, res, next) => { next((0, http_errors_1.default)(404)); });
    app.use(HandleErrors);
    app.all('*', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () { yield HandleErrors((0, http_errors_1.default)(500), req, res, next); }));
    // #endregion
    // Start the server
    app.listen(globals_1.PORT);
    globals_1.logger.info(`Server started on port ${globals_1.PORT}`);
    // #region Database interval
    var finished = true;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!finished)
            return;
        const client = yield db_1.pgConn.connect();
        function tryQuery(query) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield client.query(query);
                }
                catch (e) {
                    globals_1.logger.error(e);
                }
            });
        }
        try {
            yield tryQuery('DELETE FROM tokens WHERE expires_at < NOW()');
            yield tryQuery(`DELETE FROM auth_tokens WHERE created_at < NOW() - INTERVAL '1 HOUR' AND verified = false`);
            yield tryQuery(`DELETE FROM csp_reports WHERE created_at < NOW() - INTERVAL '1 MONTH'`);
            yield tryQuery(`DELETE FROM users WHERE end_date < NOW()`);
            yield tryQuery(`DELETE FROM users U USING emails E
				WHERE E.refer = 0
					AND E.verified = false
					AND E.usrid = U.id
					AND U.created_at < NOW() - INTERVAL '1 HOUR'`);
            yield tryQuery(`DELETE FROM emails WHERE verified = false AND created_at < NOW() - INTERVAL '1 HOUR'`);
            yield tryQuery(`DELETE FROM blacklist WHERE ends_at < NOW()`);
        }
        catch (e) {
            globals_1.logger.error(e);
        }
        finally {
            finished = true;
            client.release();
        }
    }), 60000);
    // #endregion
}))();
//# sourceMappingURL=index.js.map