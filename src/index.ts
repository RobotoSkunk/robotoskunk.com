import 'source-map-support/register';

import crypto from 'crypto';
import path from 'path';

import { RSRandom } from './libs/RSEngine';
import { getCode } from './libs/lang';

import cookieParser from 'cookie-parser';
import httpError, { HttpError } from 'http-errors';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import recursiveRouting from 'recursive-routing';
import * as useragent from 'express-useragent';
import { minify } from './libs/minify';
import { rateLimiterMiddleware } from './libs/rateLimiter';
import ejs from 'ejs';

import express, { Request, Response } from 'express';
import { conf, PORT, phrases, logger, loggerStream } from './globals';
import { mailer, pgConn, User, UserToken } from './libs/db';
import { Blacklist, UserRoles } from './libs/db-utils';


const __staticFiles = './static-http';
const app = express();


//// These comments bellow are used by DeepCode to ignore some false positives

// file deepcode ignore UseCsurfForExpress: UserToken.GenerateCSRF() and UserToken.ValidateCSRF() are used to prevent CSRF attacks.
// file deepcode ignore WebCookieHttpOnlyDisabledByDefault: UserToken.GetCookieParams() already sets the HttpOnly flag
// file deepcode ignore WebCookieSecureDisabledByDefault: UserToken.GetCookieParams() already sets the Secure flag



(async () =>
{
	app.engine('ejs', async (path, options, cb) =>
	{
		try {
			var html = await ejs.renderFile(path, options);

			html = `${RSRandom.Choose(phrases)}\n\n${html}`;
			cb(null, html);
		} catch (e) {
			cb(e);
		}
	});

	app.set('etag', false);
	app.set('views', './layouts');
	app.set('view engine', 'ejs');
	app.set('view cache', conf.production);
	app.set('x-powered-by', false);
	app.set('case sensitive routing', true);
	app.set('trust proxy', true);

	app.use(express.json({
		'type': [
			'application/json',
			'application/csp-report',
			'application/reports+json'
		]
	}));
	app.use(express.urlencoded({ 'extended': true }));
	app.use(cookieParser());
	app.use(compression());
	app.use(useragent.express());
	app.use(cors());
	app.use(helmet({ 'crossOriginEmbedderPolicy': false }));
	app.use(morgan('tiny', {
		'stream': loggerStream,
		'skip': (req, res) => res.statusCode < 500 && res.statusCode !== 429
	}));
	if (!conf.production) {
		app.use(morgan('dev', { 'stream': loggerStream }));
	}

	app.use(await minify());
	

	logger.info('###############################################################################');

	// Headers, security and server info
	app.use(async (req, res, next) =>
	{
		const nonce = crypto.randomBytes(24).toString('base64url');
		const today = new Date();
		const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
		const onlyUrl = url.split('?')[0];
		const authToken: string = req.cookies.auth_token || '';
		const lang = getCode(req.cookies.lang || req.headers['accept-language'] || 'en');

		var tokenData: UserToken.Response | undefined;
		const root = `${req.protocol}://${req.hostname}`;
		const isOnion = req.hostname.endsWith('.onion');


		res.rs = {
			'conf': conf,
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
				'token': async () => {
					if (tokenData) return tokenData;

					const tokenResponse = await UserToken.Auth(authToken, req.useragent.source);

					if (tokenResponse) {
						if (tokenResponse.updated) {
							res.cookie('auth_token', tokenResponse.text, tokenResponse.token.GetCookieParams(isOnion));
						}
					}

					tokenData = tokenResponse;
					return tokenResponse;
				},
				'isOnion': isOnion
			}
		};
		res.minifyOptions = res.minifyOptions || {};
		res.isApi = req.path.startsWith('/api/') || req.path.startsWith('/oauth/');
		res.rs.conf.root = root;



		res.renderDefault = async (view = 'layout.ejs', options = {}) =>
		{
			options = Object.assign({
				checkBannedUser: true,
				useZxcvbn: false,
				analyticsEnabled: true,
				checkIfUserHasBirthdate: true
			} as RobotoSkunk.RenderOptions, options);

			if (options.useZxcvbn) {
				const zxcvbn = await ejs.renderFile(
					path.join(process.cwd(), '/layouts/utils/zxcvbn.ejs'),
					{
						nonce: res.rs.server.nonce,
						version: res.rs.conf.version
					}
				);

				res.rs.html.head = `${zxcvbn}\n\n${res.rs.html.head}`;
			}

			res.locals = Object.assign(res.rs, options.locals || {});

			const tokenResponse = await res.rs.client.token();
			var user: User;
			if (tokenResponse) user = res.locals.user = await tokenResponse.token.GetUser();

			if (tokenResponse) {
				if (options.denyIfLoggedIn) {
					next(httpError(403, 'You are already logged in.'));
					return;
				}

				if (options.checkBannedUser) {
					if ((await user.CheckBlacklist() & Blacklist.FLAGS.BANNED) === Blacklist.FLAGS.BANNED) {
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
		};

		res.getEJSPath = (_path: string) =>
		{
			return path.join(process.cwd(), 'layouts/static', _path);
		};



		res.header('Content-Security-Policy',
			`default-src 'self' 'unsafe-hashes' 'unsafe-inline' ${!conf.production ? 'localhost:*': ''}`
			  	+ `www.redbubble.com *.robotoskunk.com robotoskunk.com www.youtube.com *.paypal.com *.facebook.com`
				+ `ko-fi.com *.ko-fi.com cdnjs.cloudflare.com api.pwnedpasswords.com js.hcaptcha.com *.hcaptcha.com`
				+ `translate.googleapis.com;`
			
			+ `script-src 'strict-dynamic' 'unsafe-inline' https: ${!conf.production || isOnion ? 'http:' : ''}`
				+ `'nonce-${nonce}';`

			+ `base-uri 'self';`
			+ `object-src 'none';`

			+ `img-src 'self' data: *.robotoskunk.com robotoskunk.com *.paypalobjects.com *.paypal.com`
				+ `*.sandbox.paypal.com cdn.discord.com imgur.com giphy.com *.imgur.com *.giphy.com i.ytimg.com`
				+ `ko-fi.com *.ko-fi.com cdn.jsdelivr.net www.gstatic.com www.google.com translate.googleapis.com`
				+ `*.googleusercontent.com drive.google.com;`

			+ 'report-uri /csp-report;'
			+ (isOnion ? '' : 'upgrade-insecure-requests;')
		);

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
	});

	app.use(rateLimiterMiddleware);


	// #region Routing
	app.use(express.static(__staticFiles, {
		maxAge: conf.production ? '1y' : 0,
		dotfiles: 'ignore',
		fallthrough: true,
		etag: true
	}));


	app.use(async (req, res, next) =>
	{
		res.header('Cache-Control', 'no-cache');
		next();
	});


	try {
		recursiveRouting(app, {
			keepIndex: true,
			rootDir: './dist/routes',
			filter: (f: string): boolean =>
			{
				if (f.endsWith('.map.js')) return false;

				return f.endsWith('.js');
			}
		});
	} catch (e) {
		logger.error(e);
	}

	app.get(['/phpmyadmin', '/myadmin', '/phpmyadmin/*', '/myadmin/*'], async (req, res, next) =>
	{
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

		res.redirect(RSRandom.Choose(redirects));
	});
	app.get('/teapot', async (req, res, next) =>
	{
		next(httpError(418, "I'm a teapot"));
	});


	if (!conf.production) {
		app.get('/error/:number', (req, res, next) =>
		{
			const err = Number.parseInt(req.params.number);
			if (err < 400) return next(httpError(400, 'Invalid error code'));

			next(httpError(err, 'This is a bug example'));
		});

		app.get('/roles', async (req, res, next) => 
		{
			const bitmask = UserRoles.FLAGS;

			const roles = Object.keys(bitmask).map((key) =>
			{
				if (isNaN(parseInt(key))) return;
				const id = crypto.randomBytes(8).toString('base64url');

				return `<input type="checkbox" name="roles" value="${key}" id="${id}">`
					 + `<label for="${id}">${bitmask[key]}</label><br>`;
			}).filter(Boolean);

			var result = '';

			if (req.query.roles) {
				if (!Array.isArray(req.query.roles)) {
					result = `<p>Result: ${req.query.roles}</p>`;
				} else {
					const roles = (req.query.roles as string[]).map((r) => parseInt(r));
	
					var r = 0;
					for (const role of roles) r |= role;
	
					result = `<p>Result: ${r}</p>`;
				}
			}

			// file deepcode ignore XSS: <form> is not user input
			res.send(`${result}<form method="GET">${roles.join('')}<button>Submit</button></form>`);
		});

		app.get('/email-test', async (req, res, next) =>
		{
			const code = crypto.randomInt(999999).toString().padStart(6, '0');

			setTimeout(async () => {
				await mailer.Send(
					'supermj@live.com.mx',
					'Your 2FA code',
					`<h2>Sign in to your account</h2>
						<p>
							Hi!, we received a request to sign in to your account.
							If it wasn't you, you might want to change your password.
						</p>
						<p>Your code is:
						<center><h1>${code}</h1></center>

						<p>This code expires in 5 minutes.<b>Don't share this code with anyone.</b></p>`
				);
			}, 1500);
			res.status(200).send('OK');
		});
	}
	// #endregion


	// #region Error Handling
	async function HandleErrors(err: HttpError<number>, req: Request, res: Response, next: Function)
	{
		const code = err.statusCode || 500, generic = httpError(code);
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
			'debug': (conf.production ?
				undefined
				:
				(err.message ? err.message.replace(/\\/gm, '\\\\').replace(/\`/gm, '\\`') : undefined)
			),
		};


		switch (code) {
			case 400:
				res.rs.error.message = RSRandom.Choose([
					'Bad request.',
					"I can't interpret that.",
					'What kind of request is that?',
					'This request is very confusing.'
				]);
				break;

			case 401:
				res.rs.error.message = RSRandom.Choose([
					"You must authenticate.",
					"Authentication missing.",
					"You haven't authenticated.",
					"Authentication required."
				]);
				break;

			case 403:
				res.rs.error.message = RSRandom.Choose([
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
				res.rs.error.message = RSRandom.Choose([
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
				res.rs.error.message = RSRandom.Choose([
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
				res.rs.error.message = RSRandom.Choose([
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
				res.rs.error.message = RSRandom.Choose([
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

		if (code >= 500) logger.error(`${code} - ${err.message} (${res.rs.server.url})`);
		else if (!conf.production) logger.warn(`${code} - ${err.message} (${res.rs.server.url})`);

		res.status(code);
		await res.renderDefault('layout-http-error.ejs', {
			checkBannedUser: false,
			checkIfUserHasBirthdate: false
		});
	}

	app.use((req, res, next) => { next(httpError(404)); });
	app.use(HandleErrors);
	app.all('*', async (req, res, next) => { await HandleErrors(httpError(500), req, res, next); });
	// #endregion


	// Start the server
	app.listen(PORT);
	logger.info(`Server started on port ${PORT}`);


	// #region Database interval
	var finished = true;


	setInterval(async () =>
	{
		if (!finished) return;
		const client = await pgConn.connect();

		async function tryQuery(query: string) {
			try {
				await client.query(query);
			} catch (e) {
				logger.error(e);
			}
		}

		try {
			await tryQuery('DELETE FROM tokens WHERE expires_at < NOW()');
			await tryQuery(`DELETE FROM auth_tokens WHERE created_at < NOW() - INTERVAL '1 HOUR' AND verified = false`);

			await tryQuery(`DELETE FROM csp_reports WHERE created_at < NOW() - INTERVAL '1 MONTH'`);

			await tryQuery(`DELETE FROM users WHERE end_date < NOW()`);
			await tryQuery(`DELETE FROM users U USING emails E
				WHERE E.refer = 0
					AND E.verified = false
					AND E.usrid = U.id
					AND U.created_at < NOW() - INTERVAL '1 HOUR'`
			);

			await tryQuery(`DELETE FROM emails WHERE verified = false AND created_at < NOW() - INTERVAL '1 HOUR'`);
			await tryQuery(`DELETE FROM blacklist WHERE ends_at < NOW()`);
		} catch (e) {
			logger.error(e);
		} finally {
			finished = true;
			client.release();
		}
	}, 60000);
	// #endregion
})();
