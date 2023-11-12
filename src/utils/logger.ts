import winston from 'winston';
import stringify from 'safe-stable-stringify';
import path from 'path';

// Logging
const rsFormat = winston.format.printf( ({ level, message, timestamp, ...metadata }) => {
	var extras = '';
	if (metadata) extras = metadata.stack ? `\n\n${metadata.stack}\n` : (Object.keys(metadata).length ? `\n\n${stringify(metadata, null, '\t')}\n` : '');

	if (typeof message === 'object') message = stringify(message, null, '\t');
	if (typeof message === 'bigint' || typeof message === 'number' || typeof message === 'function') message = message.toString();
	if (typeof message === 'boolean') message = message ? 'true' : 'false';
	if (message === undefined) message = 'undefined';
	if (message === null) message = 'null';

	message = message.trim();

	return `[${timestamp}] ${level}: ${message}` + extras;
});

export function genTemplate(dirname: string, filename: string) {
	return {
		format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.json(),
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
		),
		transports: [
			new winston.transports.Console({
				level: 'debug',
				handleExceptions: true,
				format: winston.format.combine(
					winston.format.colorize(),
					rsFormat
				)
			}),
			new winston.transports.File({
				level: 'warn',
				maxFiles: 5,
				maxsize: 1024 * 1024 * 5,
				format: winston.format.combine( rsFormat ),
				dirname,
				filename
			})
		]
	};
}


const logger = winston.createLogger(genTemplate(path.join(process.cwd(), 'logs'), 'error.log'));

export const loggerStream = {
	write: (message: string) => { logger.debug(message); }
};

export default logger;
