import pg from 'pg';
import { conf } from '../globals';

export const pgConn = new pg.Pool({
	'user': conf.database.user,
	'password': conf.database.password,
	'database': conf.database.database,
	'host': conf.database.host
});

export const rtConn = new pg.Pool({
	'user': conf.rateLimiterDatabase.user,
	'password': conf.rateLimiterDatabase.password,
	'database': conf.rateLimiterDatabase.database,
	'host': conf.rateLimiterDatabase.host
});

