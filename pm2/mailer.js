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


const generator = require('./generator');
const package = require('../package.json');

/**
 * Returns the default configuration for pm2.
 * @param {boolean} logging If true, the logging will be enabled.
 * @returns {object} The default configuration for pm2.
 */
module.exports = (logging = false) => {
	const apps = generator([
		{
			'name': `${package.name} - mailer`,
			'script': 'dist/cluster/emails.js',
			'cwd': './',
			'watch': [ 'dist/cluster/emails.js' ]
		}
	], logging);

	return { 'apps': apps };
}
