const package = require('../package.json');

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
