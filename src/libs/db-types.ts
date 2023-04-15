
export interface Token {
	selector: string;
	val_key: string;
	created_at: Date;
	expires_at: Date;
}

export interface AuthToken extends Token {
	usrid: number;
	client: string;
	is_temp: boolean;
	last_usage: Date;
	last_update: Date;
}
