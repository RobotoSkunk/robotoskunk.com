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


import { Response } from 'express';
import env from '../env';
import { LegacyUser, UserToken } from '../libraries/db';
import { LangCode } from '../libraries/lang';


// #region Typings
declare global
{
	namespace RobotoSkunk
	{
		interface Locals
		{
			env: typeof env;
			server: {
				nonce: string;
				dateYear: number;
				url: string;
				onlyUrl: string;
				aEnabled: boolean;
			};
			html: {
				meta: {
					title: string;
					description: string;
					img: string;
					setSubtitle?: (subtitle: string) => void;
				};
				body?: string;
				head?: string;
				bodyClass?: string;
			};
			/**
			 * @deprecated Use UserToken.GetUser instead.
			 */
			user?: LegacyUser | null;
			error?: {
				code: string;
				message: string;
				imgPath: string;
				debug?: string;
				imgAlt: string;
			};
			form?: {
				bg: string;
			};
			client: {
				lang: LangCode;
				authToken: string;
				token: () => Promise<UserToken.Response>;
				isOnion: boolean;
			}
		}
	
		interface RenderOptions
		{
			locals?: any | undefined;
			checkBannedUser?: boolean | undefined;
			denyIfLoggedIn?: boolean | undefined;
			useZxcvbn?: boolean | undefined;
			analyticsEnabled?: boolean;
			checkIfUserHasBirthdate?: boolean | undefined;
		}

		interface HeadOptionsBase {
			type: 'css' | 'js' | 'link';
			source: string;
		}

		interface HeadOptionsCss extends HeadOptionsBase {
			type: 'css';
		}
		interface HeadOptionsJs extends HeadOptionsBase {
			type: 'js';
			defer?: boolean;
		}
		interface HeadOptionsLink extends HeadOptionsBase {
			type: 'link';
			as?: string;
			rel?: string;
			mimeType?: string;
		}

		type HeadOptions = HeadOptionsCss | HeadOptionsJs | HeadOptionsLink;
	}

	namespace Express
	{
		interface Response
		{
			rs: RobotoSkunk.Locals;
			renderDefault: (view?: string, options?: RobotoSkunk.RenderOptions) => Promise<void>;
			minifyOptions: any;
			isApi?: boolean
			getEJSPath: (path: string) => string;

			/**
			 * Adds a new element to the head of the page.
			 * @param elements The elements to add to the head.
			 */
			addToHead(... elements: RobotoSkunk.HeadOptions[]): void;
		}
	}
}
// #endregion


export = Response;
