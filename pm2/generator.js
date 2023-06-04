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


/**
 * Returns the default configuration for pm2.
 * @param {object[]} pm2apps The array of pm2 applications.
 * @param {boolean} [logging] If true, the logging will be enabled.
 * @returns {object} The default configuration for pm2.
 */
module.exports = (pm2apps, logging = true) => {
	const apps = pm2apps || [];

	for (var i in apps) {
		apps[i] = Object.assign({
			"watch_delay": 1000,
			'watch_options': {
				'persistent': true,
				'usePolling': false
			},
			'max_memory_restart': '150M',
			'restart_delay': 1000,
			// 'out_file':   (logging ? `logs/pm2/output/${apps[i].name}.log` : undefined),
			// 'error_file': (logging ? `logs/pm2/errors/${apps[i].name}.log` : undefined),
			'log_date_format': 'YYYY-MM-DD HH:mm:ss',
			'env_production': {
				'NODE_ENV': 'production'
			},
			'env_development': {
				'NODE_ENV': 'development'
			},
			'max_restarts': 10
		}, apps[i]);
	}

	return apps;
}
