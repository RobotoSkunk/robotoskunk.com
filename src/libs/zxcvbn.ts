import crypto from 'crypto';
import { RSCrypto } from '../libs/RSEngine';

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
