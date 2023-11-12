/*
	robotoskunk.com - The personal website of RobotoSkunk
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


import express from 'express';
import 'dotenv/config';

import useragent from 'express-useragent';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import renderExtension from './utils/render-extension.js';
import minify from './utils/minify.js';
import routes from './routes/index.js';
import { loggerStream } from './utils/logger.js';

import crypto from 'crypto';


process.env.PORT = process.env.PORT || '80';
const app = express();


/// Express configuration
app.set('etag', false);
app.set('views', 'views');
app.set('view engine', 'ejs');
app.set('view cache', process.env.NODE_ENV === 'production');
app.set('x-powered-by', false);
app.set('trust proxy', true);

/// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());
app.use(renderExtension);
app.use(compression());
app.use(helmet());
app.use(cors());

if (process.env.NODE_ENV === 'production') {
	app.use(await minify());
}

app.use(
	process.env.NODE_ENV === 'production' ?
		morgan('combined', {
			skip: (_, res) => res.statusCode < 500 && res.statusCode !== 429
		}) :
		morgan('dev', { stream: loggerStream })
);


/// Routes
app.use(express.static('public', {
	maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
	etag: true,
	dotfiles: 'ignore',
	fallthrough: true
}));



app.use((req, res, next) =>
{
	const nonce = crypto.randomBytes(24).toString('base64url');
	const isProduction = process.env.NODE_ENV === 'production';

	req.isOnion = req.hostname.endsWith('.onion');


	res.header('Content-Security-Policy',
		`default-src 'self' 'unsafe-hashes' 'unsafe-inline' ${!isProduction ? 'localhost:*': ''}`
			+ ` *.robotoskunk.com robotoskunk.com www.youtube.com *.paypal.com translate.googleapis.com;`

		+ `script-src 'strict-dynamic' 'unsafe-inline' https: ${!isProduction || req.isOnion ? 'http:' : ''}`
			+ ` 'nonce-${nonce}';`

		+ `base-uri 'self';`
		+ `object-src 'none';`

		+ `img-src 'self' data: *.robotoskunk.com robotoskunk.com *.paypalobjects.com *.paypal.com`
			+ ` *.sandbox.paypal.com cdn.discord.com ko-fi.com *.ko-fi.com www.gstatic.com`
			+ ` www.google.com translate.googleapis.com *.googleusercontent.com drive.google.com;`

		+ (req.isOnion ? '' : 'upgrade-insecure-requests;')
	);

	res.header('X-UA-Compatible', 'IE=Edge');
	res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains;');
	res.header('X-Frame-Options', 'sameorigin');
	res.header('X-XSS-Protection', '0; mode=block');
	res.header('X-Content-Type-Options', 'nosniff');
	res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
	res.header('Feature-Policy', "microphone 'none'; geolocation 'none'; camera 'none';");
	res.header('Keep-Alive', 'timeout=5');
	res.header('X-Powered-By', 'Your mom');

	next();
});


app.use(routes);


app.listen(process.env.PORT, () => {
	console.log(`Server running on port ${process.env.PORT}`);
});
