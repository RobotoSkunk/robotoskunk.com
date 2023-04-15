import { RateLimiterPostgres, RateLimiterRes } from 'rate-limiter-flexible';
import { RSCrypto } from './RSEngine';
import httpError from 'http-errors';
import { conf } from '../globals';
import { rtConn } from './db';
import { Request, Response, NextFunction } from 'express';

const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;

export const __rateLimiter = new RateLimiterPostgres({
	storeClient: rtConn,
	tableName: 'rate_limiter',
	points: 50,
	duration: 1,
	keyPrefix: 'main',
	blockDuration: minute,
	inmemoryBlockOnConsumed: 51,
	clearExpiredByTimeout: true
});

export const __commentLimiter = new RateLimiterPostgres({
	storeClient: rtConn,
	tableName: 'rate_limiter',
	points: 1,
	duration: minute * 5,
	keyPrefix: 'shout',
	blockDuration: minute * 5,
	inmemoryBlockOnConsumed: 2,
	clearExpiredByTimeout: true
});

export const bruteForceLimiters = {
	byIP: new RateLimiterPostgres({
		storeClient: rtConn,
		tableName: 'rate_limiter',
		points: 100,
		duration: day,
		keyPrefix: 'bf_ip',
		blockDuration: day,
		inmemoryBlockOnConsumed: 101,
		clearExpiredByTimeout: true
	}),
	failedAttemptsAndIP: new RateLimiterPostgres({
		storeClient: rtConn,
		tableName: 'rate_limiter',
		points: 10,
		duration: hour,
		keyPrefix: 'bf_att_ip',
		blockDuration: hour,
		inmemoryBlockOnConsumed: 11,
		clearExpiredByTimeout: true
	}),
	wrongTokenInConfig: new RateLimiterPostgres({
		storeClient: rtConn,
		tableName: 'rate_limiter',
		points: 10,
		duration: day,
		keyPrefix: 'bf_token',
		blockDuration: day,
		inmemoryBlockOnConsumed: 11,
		clearExpiredByTimeout: true
	})
}

export function __setHeader(res: Response, ms: number) {
	res.header('Retry-After', '' + ~~(ms / 1000));
}
export function __setHeaderAuto(res: Response, limiterRes: RateLimiterRes) {
	__setHeader(res, limiterRes.msBeforeNext);
}

export const __httpError = httpError(429, 'Too many requests.');


export async function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
	if (res.isApi) return next();

	try {
		await __rateLimiter.consume(RSCrypto.HMAC(req.ip, conf.keys.RATE_LIMITER));
		next();
	} catch (e) {
		if (!(e instanceof Error)) __setHeaderAuto(res, e);

		next(__httpError);
	}
};

export async function rateLimiterBruteForce(req: Request, res: Response, next: NextFunction) {
	try {
		await bruteForceLimiters.byIP.consume(RSCrypto.HMAC(req.ip, conf.keys.RATE_LIMITER));
	} catch (e) {
		if (!(e instanceof Error)) __setHeaderAuto(res, e);

		next(__httpError);
		throw new Error('Too many requests');
	}
}
