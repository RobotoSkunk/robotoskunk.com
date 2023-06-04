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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUpSchema = exports.SignInSchema = exports.PointSchema = exports.CollectSchema = exports.Schema = void 0;
var Schema;
(function (Schema) {
    Schema.validate = (schema, data) => {
        if (schema.required) {
            for (const field of schema.required) {
                if (data[field] === undefined)
                    return false;
            }
        }
        for (const field in schema.fields) {
            if (data[field] !== undefined) {
                if (typeof data[field] !== schema.fields[field])
                    return false;
            }
        }
        return true;
    };
    Schema.validURI = (uri) => {
        try {
            new URL(uri);
            return true;
        }
        catch (e) {
            return false;
        }
    };
})(Schema = exports.Schema || (exports.Schema = {}));
exports.CollectSchema = {
    fields: {
        url: 'string',
        displaySize: 'object',
        referrer: 'string',
    },
    required: ['url', 'displaySize']
};
exports.PointSchema = {
    fields: {
        x: 'number',
        y: 'number',
    },
    required: ['x', 'y']
};
exports.SignInSchema = {
    fields: {
        email: 'string',
        password: 'string',
        'h-captcha-response': 'string',
        remember: 'string',
        twofa: 'string'
    },
    required: ['email', 'password', 'h-captcha-response']
};
exports.SignUpSchema = {
    fields: {
        username: 'string',
        email: 'string',
        password: 'string',
        'h-captcha-response': 'string',
        birthdate: 'number'
    },
    required: ['username', 'email', 'password', 'h-captcha-response', 'birthdate']
};
// export const CSPReportSchema = {
// 	fields: {
// 		'blocked-uri': 'string',
// 		'column-number': 'number',
// 		'document-uri': 'string',
// 		'line-number': 'number',
// 		'original-policy': 'string',
// 		'referrer': 'string',
// 		'script-sample': 'string',
// 		'source-file': 'string',
// 		'violated-directive': 'string'
// 	},
// 	required: [
// 		'blocked-uri',
// 		'column-number',
// 		'document-uri',
// 		'line-number',
// 		'original-policy',
// 		'source-file',
// 		'violated-directive'
// 	]
// }
//# sourceMappingURL=schema.js.map