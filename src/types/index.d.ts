import { Response } from 'express';
import conf from '../conf';
import { User, UserToken } from '../libs/db';
import { LangCode } from '../libs/lang';


// #region Typings
declare global
{
	namespace RobotoSkunk
	{
		interface Locals
		{
			conf: typeof conf;
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
			user?: User | null;
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
		}
	}
}
// #endregion


export = Response;
