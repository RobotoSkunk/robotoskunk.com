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
exports.minify = void 0;
const globals_1 = require("../globals");
const uglify_js_1 = __importDefault(require("uglify-js"));
const clean_css_1 = __importDefault(require("clean-css"));
const on_headers_1 = __importDefault(require("on-headers"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
function minify(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const opt = Object.assign({
            cache: path_1.default.join(process.cwd(), 'minify-cache'),
            errorHandler: (err) => { globals_1.logger.error(err); },
            matcher: {
                js: (filename, type) => {
                    if (filename.endsWith('.min.js'))
                        return false;
                    if (/javascript/.test(type))
                        return true;
                    return false;
                },
                css: (filename, type) => {
                    if (filename.endsWith('.min.css'))
                        return false;
                    if (/css/.test(type))
                        return true;
                    return false;
                }
            }
        }, options);
        const optTxt = JSON.stringify(opt);
        const fsExists = util_1.default.promisify(fs_1.default.exists), fsMkdir = util_1.default.promisify(fs_1.default.mkdir), fsReadFile = util_1.default.promisify(fs_1.default.readFile), fsWriteFile = util_1.default.promisify(fs_1.default.writeFile);
        return function (req, res, next) {
            const _write = res.write;
            const _end = res.end;
            const banner = `/*\n  Copyright RobotoSkunk ${new Date().getFullYear()}.\n*/\n`;
            var buf = null;
            var type = 'plain/text';
            (0, on_headers_1.default)(res, () => {
                if (!res.minify && res.minify !== undefined)
                    return;
                if (req.method === 'HEAD')
                    return;
                const contentType = res.getHeader('Content-Type');
                if (contentType === undefined)
                    return;
                if (/plain/.test(contentType))
                    return;
                if (!opt.matcher.css(req.path, contentType) && !opt.matcher.js(req.path, contentType))
                    return;
                type = contentType;
                res.removeHeader('Content-Length');
                buf = [];
            });
            // @ts-ignore - Overwrite the write function to buffer the response
            res.write = function (chunk, encoding) {
                if (!this._header)
                    this._implicitHeader();
                if (buf === null)
                    return _write.call(this, chunk, encoding);
                if (!this._hasBody)
                    return true;
                if (chunk.length === 0)
                    return true;
                if (typeof chunk === 'string')
                    chunk = Buffer.from(chunk, encoding);
                buf.push(chunk);
            };
            // @ts-ignore - Overwrite the end function to buffer the response
            res.end = function (data, encoding) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (this.finished)
                        return false;
                    if (!this._header)
                        this._implicitHeader();
                    if (data && !this._hasBody)
                        data = false;
                    if (buf === null)
                        return _end.call(this, data, encoding);
                    if (data)
                        this.write(data, encoding);
                    const buffer = Buffer.concat(buf);
                    const hash = crypto_1.default.createHash('sha256').update(optTxt + buffer).digest('hex');
                    const filename = path_1.default.join(opt.cache, hash);
                    try {
                        if (!(yield fsExists(opt.cache)))
                            yield fsMkdir(opt.cache);
                    }
                    catch (_) { }
                    if (fs_1.default.existsSync(filename)) {
                        const content = yield fsReadFile(filename);
                        _write.call(this, content, 'utf8');
                    }
                    else {
                        var minified = '';
                        if (opt.matcher.js(req.path, type)) {
                            minified = uglify_js_1.default.minify(buffer.toString(), {
                                'output': {
                                    'preamble': banner
                                }
                            }).code + '\n\n// robotoskunk.com';
                        }
                        else if (opt.matcher.css(req.path, type)) {
                            const css = new clean_css_1.default({
                                'inline': ['remote']
                            });
                            minified = banner + css.minify(buffer.toString()).styles + '\n\n/* robotoskunk.com */';
                        }
                        yield fsWriteFile(filename, minified);
                        _write.call(this, minified, 'utf8');
                    }
                    _end.call(this);
                });
            };
            next();
        };
    });
}
exports.minify = minify;
//# sourceMappingURL=minify.js.map