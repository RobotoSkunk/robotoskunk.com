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


declare global {
	interface Locals {
		title?: string;
		nonce: string;
		subtitle?: string;
		description?: string;
		headTags: string;

		[key: string]: any;
	}

	namespace Express {
		interface Locals {
			title?: string;
			nonce: string;
			subtitle?: string;
			description?: string;

			[key: string]: any;
		}

		interface Request {
			isOnion: boolean;
		}

		interface Response {
			minify?: boolean;

			setTitle(title: string): void;
			setSubtitle(subtitle: string): void;

			renderEta(file: string, options?: object): Promise<void>;
			sendJsonResponse(status: number, message: string | null, data?: object);
		}
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production';
			PORT?: string;
			WEBSITE_NAME?: string;
		}
	}
}


export { };
