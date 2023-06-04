/*
	robotoskunk.com - The whole main website of RobotoSkunk.
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


import UA from 'express-useragent';
import { QueryResult, PoolClient } from 'pg';

import { logger } from '../globals';
import { pgConn as pg } from './db';
import { getCountryCode, available } from '../data/timezones';




export interface Visit {
	visits: number;
	today: number;
}
export interface Visits { [key: string]: Visit }
export interface Data {
	referrers: {
		domain: string,
		count: number
	}[],
	paths: {
		path: string,
		count: number
	}[],
	browsers: {
		browser: string,
		version: string,
		is_mobile: boolean,
		count: number
	}[],
	os: {
		os: string,
		count: number
	}[],
	screens: {
		size: [number, number],
		count: number
	}
}


export class Analytics {
	public static now(): Date {
		const n = new Date();
		n.setHours(0, 0, 0, 0);

		return n;
	}

	// #region Setters
	private static async __setVisit(conn: PoolClient, country: string) {
		try {
			const n = Analytics.now();
			const q = await conn.query(`SELECT 1 FROM visits WHERE created_at = $1 AND country = $2`, [ n, country ]);

			if (q.rowCount === 0) await conn.query(`INSERT INTO visits (created_at, country) VALUES ($1, $2)`, [ n, country ]);
			else await conn.query(`UPDATE visits SET count = count + 1 WHERE created_at = $1 AND country = $2`, [ n, country ]);

		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	private static async __setReferrer(conn: PoolClient, domain: string) {
		try {
			const n = Analytics.now();
			const q = await conn.query(`SELECT 1 FROM visits_referrers WHERE created_at = $1 AND domain = $2`, [ n, domain ]);

			if (q.rowCount === 0) await conn.query(`INSERT INTO visits_referrers (created_at, domain) VALUES ($1, $2)`, [ n, domain ]);
			else await conn.query(`UPDATE visits_referrers SET count = count + 1 WHERE created_at = $1 AND domain = $2`, [ n, domain ]);

		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	private static async __setPath(conn: PoolClient, path: string) {
		try {
			const n = Analytics.now();
			const q = await conn.query(`SELECT 1 FROM visits_path WHERE created_at = $1 AND path = $2`, [ n, path ]);

			if (q.rowCount === 0) await conn.query(`INSERT INTO visits_path (created_at, path) VALUES ($1, $2)`, [ n, path ]);
			else await conn.query(`UPDATE visits_path SET count = count + 1 WHERE created_at = $1 AND path = $2`, [ n, path ]);

		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	private static async __setBrowser(conn: PoolClient, browser: string, version: string, isMobile: boolean) {
		try {
			const n = Analytics.now();
			const v = version.split('.')[0];

			const q = await conn.query(`SELECT 1 FROM visits_browser WHERE created_at = $1 AND browser = $2 AND version = $3 AND is_mobile = $4`, [ n, browser, v, isMobile ]);

			if (q.rowCount === 0) await conn.query(`INSERT INTO visits_browser (created_at, browser, version, is_mobile) VALUES ($1, $2, $3, $4)`, [ n, browser, v, isMobile ]);
			else await conn.query(`UPDATE visits_browser SET count = count + 1 WHERE created_at = $1 AND browser = $2 AND version = $3 AND is_mobile = $4`, [ n, browser, v, isMobile ]);

		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	private static async __setOS(conn: PoolClient, os: string) {
		try {
			const n = Analytics.now();
			const q = await conn.query(`SELECT 1 FROM visits_os WHERE created_at = $1 AND os = $2`, [ n, os ]);

			if (q.rowCount === 0) await conn.query(`INSERT INTO visits_os (created_at, os) VALUES ($1, $2)`, [ n, os ]);
			else await conn.query(`UPDATE visits_os SET count = count + 1 WHERE created_at = $1 AND os = $2`, [ n, os ]);

		} catch (e) {
			logger.error(e);
			throw e;
		}
	}

	private static async __setScreen(conn: PoolClient, width: number, height: number) {
		try {
			const n = Analytics.now();
			const point = `(${width},${height})`;
			const q = await conn.query(`SELECT 1 FROM visits_screen WHERE created_at = $1 AND size ~= $2`, [ n, point ]);

			if (q.rowCount === 0) await conn.query(`INSERT INTO visits_screen (created_at, size) VALUES ($1, $2)`, [ n, point ]);
			else await conn.query(`UPDATE visits_screen SET count = count + 1 WHERE created_at = $1 AND size ~= $2`, [ n, point ]);

		} catch (e) {
			logger.error(e);
			throw e;
		}
	}
	// #endregion



	public static async SetVisit(timezone: string, path: string, screen: number[], referrer: string | null, useragent: string) {
		if (!available.includes(timezone)) return;
		const _ua = UA.parse(useragent);
		if (_ua.isBot) return;

		const _reff = referrer ? new URL(referrer) : null;
		const countryCode = getCountryCode(timezone);;

		const conn = await pg.connect();

		try {
			await Analytics.__setVisit(conn, countryCode);
			await Analytics.__setReferrer(conn, _reff ? _reff.hostname : 'direct');
			await Analytics.__setPath(conn, path);
			await Analytics.__setBrowser(conn, _ua.browser, _ua.version, _ua.isMobile);
			await Analytics.__setOS(conn, _ua.platform);
			await Analytics.__setScreen(conn, screen[0], screen[1]);
		} catch (e) {
			logger.error(e);
			throw e;
		} finally {
			conn.release();
		}
	}

	// public static async GetData(start: Date, end: Date) {
	// 	const conn = await pg.connect();

	// 	try {
	// 		const reffs = await conn.query(`SELECT domain, SUM(count) FROM visits_referrers WHERE created_at BETWEEN $1 AND $2 GROUP BY domain`, [ start.getTime(), end.getTime() ]);
	// 		const paths = await conn.query(`SELECT path, SUM(count) FROM visits_path WHERE created_at BETWEEN $1 AND $2 GROUP BY path`, [ start.getTime(), end.getTime() ]);
	// 		const browsers = await conn.query(`SELECT browser, version, is_mobile, SUM(count) FROM visits_browser WHERE created_at BETWEEN $1 AND $2 GROUP BY browser, version, is_mobile`, [ start.getTime(), end.getTime() ]);
	// 		const os = await conn.query(`SELECT os, SUM(count) FROM visits_os WHERE created_at BETWEEN $1 AND $2 GROUP BY os`, [ start.getTime(), end.getTime() ]);
	// 		const screen = await conn.query(`SELECT size, SUM(count) FROM visits_screen WHERE created_at BETWEEN $1 AND $2 GROUP BY size`, [ start.getTime(), end.getTime() ]);


	// 	} catch (e) {
	// 		logger.error(e);
	// 		throw e;
	// 	} finally {
	// 		conn.release();
	// 	}
	// }

	public static async GetVisits(): Promise<Visits> {
		const visits: Visits = {};
		const conn = await pg.connect();

		try {
			const n = Analytics.now();

			const all = await conn.query(`SELECT country, SUM(count) FROM visits GROUP BY country`);

			for (const row of all.rows) {
				visits[row.country] = {
					visits: row.sum,
					today: 0
				};
			}

			const today = await conn.query(`SELECT country, SUM(count) FROM visits WHERE created_at = $1 GROUP BY country`, [ n ]);

			for (const row of today.rows)
				visits[row.country].today = row.sum;

		} catch (e) {
			logger.error(e);
			throw e;
		} finally {
			conn.release();
		}

		return visits;
	}
}
