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
			'name': package.name,
			'script': package.main,
			'cwd': './',
			'watch': [
				'dist/'
			]
		}
	], logging);

	return { 'apps': apps };
}
