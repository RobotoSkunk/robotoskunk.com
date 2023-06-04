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


export const logger = winston.createLogger(genTemplate(path.join(process.cwd(), 'logs'), 'error.log'));

export const loggerStream = {
	write: (message: string) => { logger.debug(message); }
};
