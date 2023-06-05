export {};

declare global {
	export interface hcaptcha {
		render: (id: string, options: any) => void;
		reset: () => void;
		getResponse: () => string;

		ready: (cb: () => void) => void;
		on: (event: string, cb: () => void) => void;
		off: (event: string, cb: () => void) => void;

		// https://docs.hcaptcha.com/#hcaptcha-executecallback
	}

	export var hcaptcha: hcaptcha;

	export interface FormData {
		toJSON: () => any;
	}

	export function Velocity (element: HTMLElement | NodeListOf<HTMLElement>, properties: any, options?: any): void;

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

	export var article: Article;
	export var discount: number;

	export interface SvgMap {
		targetElementID: string;
		data: {
			data: {
				[key: string]: {
					name: string;
					format: string;
				}
			}
			values: {
				[key: string]: number;
			}
			applyData: string;
		}
		colorMax: string;
		colorMin: string;
		colorNoData: string;
		countryNames: {
			[key: string]: string;
		}
	}
	export function svgMap(options: SvgMap): void;
}
