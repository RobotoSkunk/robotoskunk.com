"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCode = exports.checkLangCode = void 0;
function checkLangCode(lang) {
    return lang === 'en' || lang === 'es' || lang === 'pt' || lang === 'fr';
}
exports.checkLangCode = checkLangCode;
function getCode(acceptLanguage) {
    const languages = acceptLanguage.split(',');
    for (const language of languages) {
        const [lang] = language.split(';');
        if (checkLangCode(lang)) {
            return lang;
        }
    }
    return 'en';
}
exports.getCode = getCode;
//# sourceMappingURL=lang.js.map