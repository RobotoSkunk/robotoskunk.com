import stringify from "safe-stable-stringify";
import env from "../env";
import { logger } from "../globals";

const base = env.production ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";


export async function createOrder(price: number) {
	try {
		const accessToken = await generateAccessToken();
		if (!accessToken) return null;

		const response = await fetch(`${base}/v2/checkout/orders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`
			},
			body: stringify({
				intent: 'CAPTURE',
				purchase_units: [{
					amount: {
						currency_code: 'USD',
						value: price.toString()
					}
				}]
			})
		});

		return await response.json();
	} catch (e) {
		logger.error(e);
	}

	return null;
}

export async function capturePayment(orderId: string): Promise<PayPalOrderCapture> {
	try {
		const accessToken = await generateAccessToken();
		if (!accessToken) return null;

		const response = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`
			},
			body: '{}'
		});

		return handleResponse<PayPalOrderCapture>(response);
	} catch (e) {
		logger.error(e);
	}

	return null;
}

export async function generateAccessToken(): Promise<string> {
	try {
		const auth = Buffer.from(`${env.paypal.id}:${env.paypal.secret}`).toString('base64');

		const response = await fetch(`${base}/v1/oauth2/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${auth}`,
				'Accept-Encoding': ''
			},
			body: 'grant_type=client_credentials'
		});


		const jsonData = await handleResponse<any>(response);
		if (!jsonData) return null;

		return jsonData.access_token;
	} catch (e) {
		logger.error(e);
	}

	return null;
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (response.status >= 200 && response.status < 300)
		return await response.json();

	logger.error(await response.json());
	return null;
}


/**
 * https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
export interface PayPalOrderCapture {
	id: string;
	status: string;
	payment_source: {
		paypal: {
			name: {
				given_name: string;
				surname: string;
			};
			email_address: string;
			account_id: string;
		};
	};
	purchase_units: {
		reference_id: string;
		shipping: {
			address: {
				address_line_1: string;
				address_line_2: string;
				admin_area_2: string;
				admin_area_1: string;
				postal_code: string;
				country_code: string;
			};
		};
		payments: {
			captures: {
				id: string;
				status: string;
				amount: {
					currency_code: string;
					value: string;
				};
				seller_protection: {
					status: string;
					dispute_categories: string[];
				};
				final_capture: boolean;
				disbursement_mode: string;
				seller_receivable_breakdown: {
					gross_amount: {
						currency_code: string;
						value: string;
					};
					paypal_fee: {
						currency_code: string;
						value: string;
					};
					net_amount: {
						currency_code: string;
						value: string;
					};
				};
				create_time: string;
				update_time: string;
				links: {
					href: string;
					rel: string;
					method: string;
				}[];
			}[];
		};
	}[];
	payer: {
		name: {
			given_name: string;
			surname: string;
		};
		email_address: string;
		payer_id: string;
	};
	links: {
		href: string;
		rel: string;
		method: string;
	}[];
}

