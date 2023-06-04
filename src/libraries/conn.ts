import pg from 'pg';
import { env } from '../globals';

export const pgConn = new pg.Pool({
	'user': env.database.user,
	'password': env.database.password,
	'database': env.database.database,
	'host': env.database.host
});

export const rtConn = new pg.Pool({
	'user': env.rateLimiterDatabase.user,
	'password': env.rateLimiterDatabase.password,
	'database': env.rateLimiterDatabase.database,
	'host': env.rateLimiterDatabase.host
});

