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

