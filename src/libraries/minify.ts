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


import { Request, Response } from 'express';
import { logger } from '../globals';

import uglify from 'uglify-js';
import CleanCss from 'clean-css';
import onHeaders from 'on-headers';

import path from 'path';
import util from 'util';
import fs from 'fs';
import crypto from 'crypto';



export interface RSMinifyOptions {
	cache?: string,
	matcher?: {
		js?: (filename: string, type: string) => boolean,
		css?: (filename: string, type: string) => boolean
	}
}

declare global {
	namespace Express {
		export interface Response {
			minify: boolean;
		}
	}
}




export async function minify(options: RSMinifyOptions = {}) {
	const opt = Object.assign({
		cache: path.join(process.cwd(), 'minify-cache'),
		errorHandler: (err: Error) => { logger.error(err); },
		matcher: {
			js: (filename: string, type: string) => {
				if (filename.endsWith('.min.js')) return false;
				if (/javascript/.test(type)) return true;

				return false;
			},
			css: (filename: string, type: string) => {
				if (filename.endsWith('.min.css')) return false;
				if (/css/.test(type)) return true;

				return false;
			}
		}
	} as RSMinifyOptions, options);
	const optTxt = JSON.stringify(opt);

	const fsExists = util.promisify(fs.exists),
		  fsMkdir = util.promisify(fs.mkdir),
		  fsReadFile = util.promisify(fs.readFile),
		  fsWriteFile = util.promisify(fs.writeFile);


	return function (req: Request, res: Response, next: Function) {
		const _write = res.write;
		const _end = res.end;
		const banner = `/*\n  Copyright RobotoSkunk ${new Date().getFullYear()}.\n*/\n`;

		var buf: Buffer[] = null;
		var type = 'plain/text';


		onHeaders(res, () => {
			if (!res.minify && res.minify !== undefined) return;
			if (req.method === 'HEAD') return;

			const contentType = res.getHeader('Content-Type') as string;
			if (contentType === undefined) return;


			if (/plain/.test(contentType)) return;
			if (!opt.matcher.css(req.path, contentType) && !opt.matcher.js(req.path, contentType)) return;


			type = contentType;
			res.removeHeader('Content-Length');

			buf = [];
		});

		// @ts-ignore - Overwrite the write function to buffer the response
		res.write = function (chunk: any, encoding: BufferEncoding) {
			if (!this._header) this._implicitHeader();
			if (buf === null) return _write.call(this, chunk, encoding);

			if (!this._hasBody) return true;
			if (chunk.length === 0) return true;


			if (typeof chunk === 'string') chunk = Buffer.from(chunk, encoding);
			buf.push(chunk);
		};

		// @ts-ignore - Overwrite the end function to buffer the response
		res.end = async function (data: any, encoding: BufferEncoding) {
			if (this.finished) return false;
			if (!this._header) this._implicitHeader();
			if (data && !this._hasBody) data = false;

			if (buf === null) return _end.call(this, data, encoding);
			if (data) this.write(data, encoding);

			const buffer = Buffer.concat(buf);
			const hash = crypto.createHash('sha256').update(optTxt + buffer).digest('hex');
			const filename = path.join(opt.cache, hash);


			try {
				if (!await fsExists(opt.cache)) await fsMkdir(opt.cache);
			} catch(_) { }


			if (fs.existsSync(filename)) {
				const content = await fsReadFile(filename);

				_write.call(this, content, 'utf8');
			}
			else {
				var minified = '';

				if (opt.matcher.js(req.path, type as string)) {
					minified = uglify.minify(buffer.toString(), {
						'output': {
							'preamble': banner
						}
					}).code + '\n\n// robotoskunk.com';
				}
				else if (opt.matcher.css(req.path, type as string)) {
					const css = new CleanCss({
						'inline': ['remote']
					});
					minified = banner + css.minify(buffer.toString()).styles + '\n\n/* robotoskunk.com */';
				}

				await fsWriteFile(filename, minified);
				_write.call(this, minified, 'utf8');
			}

			_end.call(this);
		}

		next();
	}
}
