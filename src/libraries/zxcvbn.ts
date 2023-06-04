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


import crypto from 'crypto';
import { RSCrypto } from 'dotcomcore/dist/RSEngine';

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import zxcvbnCommon from '@zxcvbn-ts/language-common';
import zxcvbnEn from '@zxcvbn-ts/language-en';
import zxcvbnEs from '@zxcvbn-ts/language-es-es';
import zxcvbnFr from '@zxcvbn-ts/language-fr';
import zxcvbnPt from '@zxcvbn-ts/language-pt-br';

zxcvbnOptions.setOptions({
	'translations': zxcvbnEn.translations,
	'graphs': zxcvbnCommon.adjacencyGraphs,
	'dictionary': {
		...zxcvbnCommon.dictionary,
		...zxcvbnEn.dictionary,
		...zxcvbnEs.dictionary,
		...zxcvbnFr.dictionary,
		...zxcvbnPt.dictionary
	}
});

/**
 * Sends a request to haveibeenpwned.com to check if a password was exposed by a data breach.
 * @param password The password to check.
 * @returns A promise that resolves to true if the password was exposed by a data breach.
 */
async function haveIBeenPwned(password: string): Promise<string | null> {
	return new Promise(async (resolve, reject) => {
		try {
			var pwned = null;

			// deepcode ignore InsecureHash: This is obligatory from the HaveIBeenPwned API
			const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
			const response = await fetch(`https://api.pwnedpasswords.com/range/${encodeURIComponent(hash.substring(0, 5))}`);

			if (response.ok) {
				const data = await response.text();
				pwned = data.split('\r\n').find((line: string) => RSCrypto.Compare(line.split(':')[0], hash.substring(5)));
			}

			resolve(pwned);
		} catch (e) {
			reject(e);
		}
	});
}

export {
	haveIBeenPwned,
	zxcvbn
};
