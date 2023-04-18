import crypto from 'crypto';

export interface Article
{
	id: string;
	label: string;
	description: string;
	img: string;
	notes?: string;
	price: number;
	size: {
		custom: boolean;
		defaults: [number, number][];
	}
	options: {
		id: string;
		label: string;
		group: number;
		type: 'select' | 'radio' | 'checkbox' | 'text' | 'number' | 'color';
		options?: {
			id: string;
			label?: string;
			value: number;
			default?: boolean;
		}[],
		data?: {
			action: 'add' | 'subtract' | 'multiply' | 'divide';
			range: [number, number];
			value: number;
		}
	}[]
}






export interface DBData_template
{
	version: number;
}

// Compatibility with old commissions system
export interface DBData_v1 extends DBData_template
{
	version: 1;
	data: {
		label: string;
		value: string;
	}[];
}

// New commissions system
export interface DBData_v2 extends DBData_template
{
	version: 2;
	data: {
		options: {
			label: string,
			name?: string,
			value: number,
			type: 'price' | 'add' | 'subtract' | 'multiply' | 'divide' | 'text' | 'number' | 'color'
		}[],
		total: number
	}[];
}

export type DBData = DBData_v1 | DBData_v2;




export interface Commission
{
	id: string;
	author: string;
	_title: string;
	_desc: string;
	_size: { x: number, y: number };
	price: string;
	discount: number;
	created_at: Date;
	curl: string;
	notes: string;
	deadline: Date;
	cancel_reason: string;
	paypal_id: string;
	paypal_paid_at: Date;
	details: DBData;
	preview: string;
}







// I was too lazy to create a new PostgreSQL table for this, so I just used this JSON.
// Don't worry, I'll code a proper table for this in the future.

export const articles: Article[] = [
	{
		id: 'artwork',
		label: 'Artwork',
		description: 'Cute custom artworks of your characters!',
		img: 'artwork.webp',
		notes: 'Please note that I will not draw NSFW content.',
		price: 7,
		size: {
			custom: true,
			defaults: [
				[ 2048, 2048 ],
				[ 1920, 1080 ],
				[ 2560, 1600 ],
				[ 4096, 2048 ],
				[ 4096, 4096 ]
			]
		},
		options: [
			{
				id: crypto.randomUUID(),
				label: 'Drawing type',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Headshot',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Half body',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Full body',
						value: 2
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Lineart',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Classical',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Colored',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Lineless',
						value: 2
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Color',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Monochrome',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Colorful',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Shaded',
						value: 3
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Background',
				group: 1,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Transparent or flat color',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Simple gradient',
						value: 0.2
					}, {
						id: crypto.randomUUID(),
						label: 'Complex gradient',
						value: 0.5
					}, {
						id: crypto.randomUUID(),
						label: 'Detailed background',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Complex background',
						value: 5
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Number of characters',
				group: 0,
				type: 'number',
				data: {
					value: 1,
					range: [1, 5],
					action: 'multiply'
				}
			}
		]
	}, {
		id: 'interactive-wallpaper',
		label: 'Interactive wallpaper',
		description: 'Cute custom interactive wallpapers to make your desktop bright!<br><br>'
			+ '<b>Minimum system requirement</b><br><pre><code>'
				+ 'OS: Windows 7 or above | Linux x64 bits<br>'
				+ 'Processor: Intel i3 or equivalent<br>'
				+ 'Memory: 1 GB of RAM<br>'
				+ 'Graphics: HD Graphics 3000 or above<br>'
				+ 'DirectX: Version 10 or above<br>'
				+ 'Storage: 25 MB available space'
			+ '</code></pre>',
		img: 'interactive-wallpaper.webp',
		notes: 'Install [Lively Wallpaper (free)](https:\/\/rocksdanister.github.io\/lively\/) or'
			+ '[Wallpaper Engine (paid)](https:\/\/www.wallpaperengine.io\/) to run your wallpaper.',
		price: 26,
		size: {
			custom: true,
			defaults: [
				[ 1024, 768 ],
				[ 1280, 720 ],
				[ 1366, 768 ],
				[ 1920, 1080 ],
				[ 2560, 1600 ],
				[ 3840, 2160 ]
			]
		},
		options: [
			{
				id: crypto.randomUUID(),
				label: 'Wallpaper type',
				group: 1,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Animated',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Simple character',
						value: 2
					}, {
						id: crypto.randomUUID(),
						label: 'Complex character',
						value: 5
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Character type',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Half body',
						value: 0.5
					}, {
						id: crypto.randomUUID(),
						label: 'Full body',
						value: 1
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Lineart',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Classical',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Colored',
						value: 0.5
					}, {
						id: crypto.randomUUID(),
						label: 'Lineless',
						value: 1
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Color',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Monochrome',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Colorful',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Shaded',
						value: 3
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Background',
				group: 1,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Flat color',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Simple gradient',
						value: 0.2
					}, {
						id: crypto.randomUUID(),
						label: 'Complex gradient',
						value: 0.5
					}, {
						id: crypto.randomUUID(),
						label: 'Detailed background',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Complex background',
						value: 5
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Animation',
				group: 1,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Static',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Simple animation',
						value: 0.5
					}, {
						id: crypto.randomUUID(),
						label: 'Complex animation',
						value: 8
					}
				]
			}
		]
	}, {
		id: 'digital-stickers',
		label: 'Digital stickers',
		description: 'A digital sticker is a small image that can be used as a sticker on social media,'
					+ 'or as a profile picture. They are usually simple and colorful.',
		img: 'stickers.webp',
		price: 6,
		size: {
			custom: false,
			defaults: [
				[ 512, 512 ]
			]
		},
		options: [
			{
				id: crypto.randomUUID(),
				label: 'Sticker type',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Just a character',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'More than one character',
						value: 2
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Drawing type',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Half body',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Full body',
						value: 1
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Lineart',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Classical',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Colored',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Lineless',
						value: 2
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Color',
				group: 0,
				type: 'radio',
				options: [
					{
						id: crypto.randomUUID(),
						label: 'Monochrome',
						value: 0
					}, {
						id: crypto.randomUUID(),
						label: 'Colorful',
						value: 1
					}, {
						id: crypto.randomUUID(),
						label: 'Shaded',
						value: 3
					}
				]
			}, {
				id: crypto.randomUUID(),
				label: 'Number of stickers',
				group: 0,
				type: 'number',
				data: {
					value: 1,
					range: [1, 10],
					action: 'multiply'
				}
			}
		]
	}
];


