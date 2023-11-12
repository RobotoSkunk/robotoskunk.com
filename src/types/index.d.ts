/*
	robotoskunk.com - The personal website of RobotoSkunk
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


declare global {
	namespace RobotoSkunk {
		type HeadTag = HeadTag_CSS | HeadTag_JS | HeadTag_Link;

		interface HeadTag_Template {
			type: 'js' | 'css' | 'link';
			source: string;
		}

		interface HeadTag_CSS extends HeadTag_Template {
			type: 'css';
		}

		interface HeadTag_JS extends HeadTag_Template {
			type: 'js';
			defer?: boolean;
		}

		interface HeadTag_Link extends HeadTag_Template {
			type: 'link';
			as?: string;
			rel?: string;
			mimeType?: string;
		}
	}

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
			headTags: string;

			[key: string]: any;
		}

		interface Request {
			isOnion: boolean;
		}

		interface Response {
			minify?: boolean;

			setSubtitle(subtitle: string): void;
			addHeadTag(... tag: RobotoSkunk.HeadTag[]): void;
	
			renderLayout(file: string, options?: object): Promise<void>;
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
