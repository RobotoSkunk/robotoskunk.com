"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
const express_useragent_1 = __importDefault(require("express-useragent"));
const globals_1 = require("../globals");
const db_1 = require("./db");
const timezones_1 = require("../data/timezones");
class Analytics {
    static now() {
        const n = new Date();
        n.setHours(0, 0, 0, 0);
        return n;
    }
    // #region Setters
    static __setVisit(conn, country) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const n = Analytics.now();
                const q = yield conn.query(`SELECT 1 FROM visits WHERE created_at = $1 AND country = $2`, [n, country]);
                if (q.rowCount === 0)
                    yield conn.query(`INSERT INTO visits (created_at, country) VALUES ($1, $2)`, [n, country]);
                else
                    yield conn.query(`UPDATE visits SET count = count + 1 WHERE created_at = $1 AND country = $2`, [n, country]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
        });
    }
    static __setReferrer(conn, domain) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const n = Analytics.now();
                const q = yield conn.query(`SELECT 1 FROM visits_referrers WHERE created_at = $1 AND domain = $2`, [n, domain]);
                if (q.rowCount === 0)
                    yield conn.query(`INSERT INTO visits_referrers (created_at, domain) VALUES ($1, $2)`, [n, domain]);
                else
                    yield conn.query(`UPDATE visits_referrers SET count = count + 1 WHERE created_at = $1 AND domain = $2`, [n, domain]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
        });
    }
    static __setPath(conn, path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const n = Analytics.now();
                const q = yield conn.query(`SELECT 1 FROM visits_path WHERE created_at = $1 AND path = $2`, [n, path]);
                if (q.rowCount === 0)
                    yield conn.query(`INSERT INTO visits_path (created_at, path) VALUES ($1, $2)`, [n, path]);
                else
                    yield conn.query(`UPDATE visits_path SET count = count + 1 WHERE created_at = $1 AND path = $2`, [n, path]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
        });
    }
    static __setBrowser(conn, browser, version, isMobile) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const n = Analytics.now();
                const v = version.split('.')[0];
                const q = yield conn.query(`SELECT 1 FROM visits_browser WHERE created_at = $1 AND browser = $2 AND version = $3 AND is_mobile = $4`, [n, browser, v, isMobile]);
                if (q.rowCount === 0)
                    yield conn.query(`INSERT INTO visits_browser (created_at, browser, version, is_mobile) VALUES ($1, $2, $3, $4)`, [n, browser, v, isMobile]);
                else
                    yield conn.query(`UPDATE visits_browser SET count = count + 1 WHERE created_at = $1 AND browser = $2 AND version = $3 AND is_mobile = $4`, [n, browser, v, isMobile]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
        });
    }
    static __setOS(conn, os) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const n = Analytics.now();
                const q = yield conn.query(`SELECT 1 FROM visits_os WHERE created_at = $1 AND os = $2`, [n, os]);
                if (q.rowCount === 0)
                    yield conn.query(`INSERT INTO visits_os (created_at, os) VALUES ($1, $2)`, [n, os]);
                else
                    yield conn.query(`UPDATE visits_os SET count = count + 1 WHERE created_at = $1 AND os = $2`, [n, os]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
        });
    }
    static __setScreen(conn, width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const n = Analytics.now();
                const point = `(${width},${height})`;
                const q = yield conn.query(`SELECT 1 FROM visits_screen WHERE created_at = $1 AND size ~= $2`, [n, point]);
                if (q.rowCount === 0)
                    yield conn.query(`INSERT INTO visits_screen (created_at, size) VALUES ($1, $2)`, [n, point]);
                else
                    yield conn.query(`UPDATE visits_screen SET count = count + 1 WHERE created_at = $1 AND size ~= $2`, [n, point]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
        });
    }
    // #endregion
    static SetVisit(timezone, path, screen, referrer, useragent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!timezones_1.available.includes(timezone))
                return;
            const _ua = express_useragent_1.default.parse(useragent);
            if (_ua.isBot)
                return;
            const _reff = referrer ? new URL(referrer) : null;
            const countryCode = (0, timezones_1.getCountryCode)(timezone);
            ;
            const conn = yield db_1.pgConn.connect();
            try {
                yield Analytics.__setVisit(conn, countryCode);
                yield Analytics.__setReferrer(conn, _reff ? _reff.hostname : 'direct');
                yield Analytics.__setPath(conn, path);
                yield Analytics.__setBrowser(conn, _ua.browser, _ua.version, _ua.isMobile);
                yield Analytics.__setOS(conn, _ua.platform);
                yield Analytics.__setScreen(conn, screen[0], screen[1]);
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
            finally {
                conn.release();
            }
        });
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
    static GetVisits() {
        return __awaiter(this, void 0, void 0, function* () {
            const visits = {};
            const conn = yield db_1.pgConn.connect();
            try {
                const n = Analytics.now();
                const all = yield conn.query(`SELECT country, SUM(count) FROM visits GROUP BY country`);
                for (const row of all.rows) {
                    visits[row.country] = {
                        visits: row.sum,
                        today: 0
                    };
                }
                const today = yield conn.query(`SELECT country, SUM(count) FROM visits WHERE created_at = $1 GROUP BY country`, [n]);
                for (const row of today.rows)
                    visits[row.country].today = row.sum;
            }
            catch (e) {
                globals_1.logger.error(e);
                throw e;
            }
            finally {
                conn.release();
            }
            return visits;
        });
    }
}
exports.Analytics = Analytics;
//# sourceMappingURL=analytics.js.map