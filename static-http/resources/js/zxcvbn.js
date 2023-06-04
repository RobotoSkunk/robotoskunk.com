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


zxcvbnts.core.zxcvbnOptions.setOptions({
	'translations': zxcvbnts['language-en'].translations,
	'graphs': zxcvbnts['language-common'].adjacencyGraphs,
	'dictionary': {
		...zxcvbnts['language-common'].dictionary,
		...zxcvbnts['language-en'].dictionary,
		...zxcvbnts['language-es-es'].dictionary
	}
});

/**
 * Sends a request to haveibeenpwned.com to check if a password was exposed by a data breach.
 * @param {string} password The password to check.
 * @returns {Promise<string | null>} A promise that resolves to true if the password was exposed by a data breach.
 */
 async function haveIBeenPwned(password) {
	return new Promise(async (resolve, reject) => {
		try {
			var pwned = null;

			if (!crypto.subtle) throw new Error('WebCrypto is not supported. Cannot check if password was exposed by a data breach.');

			// deepcode ignore InsecureHash: This is obligatory from the HaveIBeenPwned API
			const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();


			const response = await fetch(`https://api.pwnedpasswords.com/range/${encodeURIComponent(hash.substring(0, 5))}`, {
				'headers': { 'Add-Padding': 'true' }
			});

			if (response.ok) {
				const text = await response.text();

				pwned = text.split('\r\n').find(
					/**
					 * @param {string} line 
					 */
					(line) => line.split(':')[0] === hash.substring(5)
				);
			}

			resolve(pwned);
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * Checks if a password is strong enough.
 * @param {string} password The password to check.
 * @returns {Promise<{score: number, scoreText: string, feedback: {warning: string, suggestions: string[]}}>} A promise that resolves to the password's score and feedback.
 */
async function zxcvbn(password) {
	const json = {
		score: 0,
		scoreText: '',
		feedback: {
			warning: '',
			suggestions: []
		}
	};
	const score = [ 'Very weak', 'Weak', 'Mediocre', 'Strong', 'Very strong' ];


	try {
		if (await haveIBeenPwned(password)) {
			json.scoreText = 'Pwned';
			json.feedback.warning = 'This password was exposed in a data breach.';
			json.feedback.suggestions.push("If you're using this password elsewhere, you should change it.");
	
			return json;
		}
	} catch (e) {
		console.error(e);
	}


	const result = zxcvbnts.core.zxcvbn(password, [ 'robotoskunk', 'roboto', 'alexskunk' ]);

	json.score = result.score;
	json.scoreText = score[result.score];
	json.feedback.warning = result.feedback.warning;
	json.feedback.suggestions = result.feedback.suggestions;


	return json;
}
