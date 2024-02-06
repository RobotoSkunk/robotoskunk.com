/*
	robotoskunk.com - The personal website of RobotoSkunk
	Copyright (C) 2024 Edgar Alexis Lima <contact@robotoskunk.com>

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


import { Response, Request, NextFunction } from 'express';

import { Eta } from 'eta';


export default function (views: string)
{
	const eta = new Eta({ views, varName: 'data' });


	return function (req: Request, res: Response, next: NextFunction)
	{
		res.locals.title = process.env.WEBSITE_NAME || 'RobotoSkunk';

		res.setSubtitle = (subtitle: string) =>
		{
			res.locals.subtitle = subtitle;
		}

		res.setTitle = (title: string) =>
		{
			res.locals.title = title;
		}

		res.sendJsonResponse = (status: number, message: string, data?: object) =>
		{
			res.status(status).json({
				message,
				data
			});
		}


		res.renderEta = async function (view: string, options?: object)
		{
			if (typeof options === 'function')
			{
				options = undefined;
			}

			if (options === undefined)
			{
				options = {};
			}


			options = Object.assign(options, {
				__title__: (res.locals.subtitle ? `${res.locals.subtitle} - ` : '') + res.locals.title,
				__canonical__: `${req.protocol}://${req.hostname}${req.originalUrl}`,
				locals: res.locals,

				tag: {
					css: (file: string) =>
					{
						return `<link rel="preload" href="/assets/css/${file}.css" as="style">` +
								`<link rel="stylesheet" href="/assets/css/${file}.css">`;
					},
					js: (file: string) =>
					{
						return `<script defer src="/assets/js/${file}.js" nonce="${res.locals.nonce}"></script>`;
					}
				}
			});

			// file deepcode ignore XSS: ETA already escapes HTML
			res.send(await eta.renderAsync(view, options));
		};

		next();
	}
}
