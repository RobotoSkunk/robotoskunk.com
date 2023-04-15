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
