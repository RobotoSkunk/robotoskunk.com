"use strict";
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
})(Schema || (exports.Schema = Schema = {}));
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