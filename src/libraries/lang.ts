export type LangCode = 'en' | 'es' | 'pt' | 'fr';

export function checkLangCode(lang: string): lang is LangCode {
	return lang === 'en' || lang === 'es' || lang === 'pt' || lang === 'fr';
}

export function getCode(acceptLanguage: string): LangCode {
	const languages = acceptLanguage.split(',');
	
	for (const language of languages) {
		const [lang] = language.split(';');
		if (checkLangCode(lang)) {
			return lang as LangCode;
		}
	}

	return 'en' as LangCode;
}

export interface LangObject {
	en: { [key: string]: string; },
	es: { [key: string]: string; },
	pt: { [key: string]: string; },
	fr: { [key: string]: string; }
}

