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
}
