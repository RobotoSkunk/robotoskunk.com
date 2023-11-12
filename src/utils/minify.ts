import { Request, Response } from 'express';
import logger from './logger.js';

import uglify from 'uglify-js';
import CleanCss from 'clean-css';
import onHeaders from 'on-headers';
import stringify from 'safe-stable-stringify';

import path from 'path';
import util from 'util';
import fs from 'fs';
import crypto from 'crypto';



export interface RSMinifyOptions
{
	cache?: string,
	matcher?: {
		js?: (filename: string, type: string) => boolean,
		css?: (filename: string, type: string) => boolean
	}
}


const defaultOptions = {
	cache: path.join(process.cwd(), '.cache'),
	errorHandler: (err: Error) =>
	{
		logger.error(err);
	},
	matcher: {
		js: (filename: string, type: string) =>
		{
			if (filename.endsWith('.min.js')) {
				return false;
			}
			if (/javascript/.test(type)) {
				return true;
			}

			return false;
		},

		css: (filename: string, type: string) =>
		{
			if (filename.endsWith('.min.css')) {
				return false;
			}
			if (/css/.test(type)) {
				return true;
			}

			return false;
		}
	}
};


export default async function minify(options: RSMinifyOptions = {})
{
	const __options__ = Object.assign(defaultOptions, options);
	const optionsText = stringify(__options__);


	const fsExists = util.promisify(fs.exists);
	const fsMkdir = util.promisify(fs.mkdir);
	const fsReadFile = util.promisify(fs.readFile);
	const fsWriteFile = util.promisify(fs.writeFile);


	return function (req: Request, res: Response, next: Function)
	{
		const _write = res.write;
		const _end = res.end;
		const banner = `/*\n  Copyright RobotoSkunk ${new Date().getFullYear()}.\n*/\n\n`;

		var buf: Buffer[] | null = null;
		var type = 'plain/text';


		onHeaders(res, () =>
		{
			if (!res.minify && res.minify !== undefined) {
				return;
			}

			if (req.method === 'HEAD') {
				return;
			}


			const contentType = res.getHeader('Content-Type') as string;
			if (contentType === undefined) {
				return;
			}


			if (/plain/.test(contentType)) {
				return;
			}

			if (!__options__.matcher.css(req.path, contentType) && !__options__.matcher.js(req.path, contentType)) {
				return;
			}


			type = contentType;
			res.removeHeader('Content-Length');

			buf = [];
		});

		// @ts-ignore - Overwrite the write function to buffer the response
		res.write = function (chunk: any, encoding: BufferEncoding)
		{
			// @ts-ignore - Bun stuff, it works anyways
			if (!this._header) {
				// @ts-ignore - Bun stuff, it works anyways
				this._implicitHeader();
			}
			if (buf === null) {
				return _write.call(this, chunk, encoding);
			}

			// @ts-ignore - Bun stuff, it works anyways
			if (!this._hasBody) {
				return true;
			}
			if (chunk.length === 0) {
				return true;
			}


			if (typeof chunk === 'string') chunk = Buffer.from(chunk, encoding);
			buf.push(chunk);
		};

		// @ts-ignore - Overwrite the end function to buffer the response
		res.end = async function (data: any, encoding: BufferEncoding)
		{
			if (this.finished) {
				return false;
			}
			// @ts-ignore - Bun stuff, it works anyways
			if (!this._header) {
				// @ts-ignore - Bun stuff, it works anyways
				this._implicitHeader();
			}
			// @ts-ignore - Bun stuff, it works anyways
			if (data && !this._hasBody) {
				data = false;
			}


			if (buf === null) {
				return _end.call(this, data, encoding);
			}
			if (data) {
				this.write(data, encoding);
			}


			const buffer = Buffer.concat(buf);
			const hash = crypto.createHash('sha256').update(optionsText + buffer).digest('hex');
			const filename = path.join(__options__.cache, `minify-${hash}`);


			try {
				if (!await fsExists(__options__.cache)) {
					await fsMkdir(__options__.cache);
				}
			} catch(_) { }


			if (fs.existsSync(filename)) {
				const content = await fsReadFile(filename);

				_write.call(this, content, 'utf8');
			}
			else {
				var minified = '';

				if (__options__.matcher.js(req.path, type as string)) {
					minified = uglify.minify(buffer.toString(), {
						'output': {
							'preamble': banner
						}
					}).code + '\n\n// robotoskunk.com';
				}
				else if (__options__.matcher.css(req.path, type as string)) {
					const css = new CleanCss({
						'inline': ['remote']
					});
					minified = banner + css.minify(buffer.toString()).styles + '\n\n/* robotoskunk.com */';
				}

				await fsWriteFile(filename, minified);
				_write.call(this, minified, 'utf8');
			}

			// @ts-ignore - Bun stuff, it works anyways
			_end.call(this);
		}

		next();
	}
}
