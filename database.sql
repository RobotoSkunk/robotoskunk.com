-- robotoskunk.com - The whole main website of RobotoSkunk.
-- Copyright (C) 2023 Edgar Alexis Lima <contact@robotoskunk.com>

-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU Affero General Public License as published
-- by the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.

-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU Affero General Public License for more details.

-- You should have received a copy of the GNU Affero General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

------------------------------------------------------------------------------------------------------------------------

-- I suggest you to use UTF-8 encoding for this database.
-- Note: This is a PostgreSQL script, not a MySQL script.


-- START OF COMMON PART ---
CREATE TABLE users (
	id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
	hash VARCHAR(64) NOT NULL,
	username VARCHAR(64) NOT NULL,
	_handler VARCHAR(64) UNIQUE,
	password TEXT NOT NULL,
	birthdate TIMESTAMP DEFAULT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	bio VARCHAR(256) DEFAULT NULL,
	avatar TEXT DEFAULT NULL,
	end_date TIMESTAMP DEFAULT NULL,
	roles SMALLINT NOT NULL DEFAULT 0,
	totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
	totp_secret TEXT DEFAULT NULL,
	totp_recovery TEXT[] DEFAULT NULL
);

CREATE TABLE emails (
	id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
	hash VARCHAR(64) NOT NULL,
	email TEXT NOT NULL,
	usrid UUID DEFAULT NULL,
	refer SMALLINT NOT NULL DEFAULT 0,
	verified BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	is_fake BOOLEAN NOT NULL DEFAULT false,

	FOREIGN KEY (usrid) REFERENCES users (id) ON DELETE CASCADE
);
-- END OF COMMON PART ---

-- START OF MODEL TABLES --
CREATE TABLE audit_log (
	_data JSON DEFAULT NULL,
	_relevance SMALLINT NOT NULL,
	_type INT NOT NULL,
	user_agent TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	destroys_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '3 months'
);

CREATE TABLE tokens (
	id TEXT NOT NULL PRIMARY KEY,
	val_key VARCHAR(64),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour'
);
-- END OF MODEL TABLES ---

-- START OF CACHE TABLES --
CREATE TABLE cache (
	_key TEXT UNIQUE NOT NULL,
	_value TEXT NOT NULL,
	_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	expires TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 DAY'
);
CREATE TABLE rate_limiter ( 
	key text PRIMARY KEY,
	points integer NOT NULL DEFAULT 0,
	expire bigint
);
-- END OF CACHE TABLES --

-- START OF SECURITY TABLES --
CREATE TABLE user_audit_log (
	_uid UUID NOT NULL,

	FOREIGN KEY (_uid) REFERENCES users (id) ON DELETE CASCADE
) INHERITS (audit_log);

CREATE TABLE verify_email_queue (
	eid UUID UNIQUE NOT NULL,

	FOREIGN KEY (eid) REFERENCES emails (id) ON DELETE CASCADE
) INHERITS (tokens);

CREATE TABLE password_resets (
	usrid UUID NOT NULL,
	
	FOREIGN KEY (usrid) REFERENCES users (id) ON DELETE CASCADE
) INHERITS (tokens);

CREATE TABLE csp_reports (
	id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
	_data JSON NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- END OF SECURITY TABLES --

-- START OF USER DATA TABLES --
CREATE TABLE follow_list (
	author UUID NOT NULL,
	victim UUID NOT NULL,
	since TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CHECK (author != victim),
	FOREIGN KEY (author) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY (victim) REFERENCES users (id) ON DELETE CASCADE,
	PRIMARY KEY (author, victim)
);

CREATE TABLE block_list (
	author UUID NOT NULL,
	victim UUID NOT NULL,
	since TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CHECK (author != victim),
	FOREIGN KEY (author) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY (victim) REFERENCES users (id) ON DELETE CASCADE,
	PRIMARY KEY (author, victim)
);

CREATE TABLE shouts (
	id BIGSERIAL PRIMARY KEY,
	author UUID DEFAULT NULL,
	victim UUID NOT NULL,
	cont TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	edited_at TIMESTAMP DEFAULT NULL,

	FOREIGN KEY (author) REFERENCES users (id) ON DELETE SET DEFAULT,
	FOREIGN KEY (victim) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE shout_edit_history (
	shout BIGINT NOT NULL,
	cont TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (shout) REFERENCES shouts (id) ON DELETE CASCADE
);

CREATE TABLE commissions (
	id TEXT PRIMARY KEY,
	author UUID,
	_title TEXT NOT NULL,
	_desc TEXT NOT NULL,
	_size POINT NOT NULL,
	price MONEY NOT NULL,
	discount REAL NOT NULL DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	curl TEXT DEFAULT NULL,
	notes TEXT DEFAULT NULL,
	deadline TIMESTAMP,
	cancel_reason TEXT,
	paypal_id TEXT,
	paypal_paid_at TIMESTAMP,
	details JSON NOT NULL,
	preview TEXT DEFAULT NULL,

	FOREIGN KEY (author) REFERENCES users (id) ON DELETE SET DEFAULT
);
-- END OF USER DATA TABLES --

-- START OF MANAGEMENT TABLES --
CREATE TABLE auth_tokens (
	usrid UUID NOT NULL,
	client TEXT NOT NULL,
	is_temp BOOLEAN NOT NULL DEFAULT false,
	verified BOOLEAN NOT NULL DEFAULT true,
	_csrf TEXT DEFAULT NULL,
	_config_auth TEXT DEFAULT NULL,
	last_usage TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (usrid) REFERENCES users (id) ON DELETE CASCADE
) INHERITS (tokens);

CREATE TABLE blacklist (
	_type SMALLINT NOT NULL DEFAULT 0,
	usrid UUID NOT NULL,
	reason TEXT DEFAULT NULL,
	ends_at TIMESTAMP DEFAULT NULL,

	FOREIGN KEY (usrid) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE mail_queue (
	id TEXT PRIMARY KEY,
	hash TEXT NOT NULL,
	_to TEXT NOT NULL,
	subject TEXT NOT NULL,
	body TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	attempts SMALLINT NOT NULL DEFAULT 0
);
-- END OF MANAGEMENT TABLES --


CREATE TABLE config (
	_key TEXT PRIMARY KEY,
	_value FLOAT NOT NULL
);

INSERT INTO config VALUES ('commissions-discount', 0), ('commissions-limit', 0), ('commissions-anonymous', 1);



-------------------------------- TRACKING TABLES -----------------------------------
--

CREATE TABLE visits (
	created_at TIMESTAMP NOT NULL,
	country TEXT NOT NULL,
	count SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE visits_referrers (
	created_at TIMESTAMP NOT NULL,
	domain TEXT NOT NULL,
	count SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE visits_path (
	created_at TIMESTAMP NOT NULL,
	path TEXT NOT NULL,
	count SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE visits_browser (
	created_at TIMESTAMP NOT NULL,
	browser TEXT NOT NULL,
	version TEXT NOT NULL,
	is_mobile BOOLEAN NOT NULL,
	count SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE visits_os (
	created_at TIMESTAMP NOT NULL,
	os TEXT NOT NULL,
	count SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE visits_screen (
	created_at TIMESTAMP NOT NULL,
	size POINT NOT NULL,
	count SMALLINT NOT NULL DEFAULT 1
);

-- END OF TRACKING TABLES --





----------------------------------- API TABLES -------------------------------------
------------------------------------------------------------------------------------
-- https://auth0.com/docs/authenticate/protocols/oauth
-- https://www.soapui.org/docs/oauth2/oauth2-overview/
-- 
-- Team members:
--   (0) Member
--   (1) Admin
--   (2) Owner
-- 


CREATE TABLE api_team (
	id BIGINT PRIMARY KEY,
	_name TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_team_member (
	_uid UUID NOT NULL,
	_tid BIGINT NOT NULL,
	_lvl SMALLINT NOT NULL DEFAULT 0,
	accepted BOOLEAN NOT NULL DEFAULT false,
	joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (_uid) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY (_tid) REFERENCES api_team (id) ON DELETE CASCADE
);

CREATE TABLE api_team_audit_log (
	_tid BIGINT NOT NULL,
	executed_by UUID DEFAULT NULL,

	FOREIGN KEY (_tid) REFERENCES api_team (id) ON DELETE CASCADE,
 	FOREIGN KEY (executed_by) REFERENCES users (id) ON DELETE SET DEFAULT
) INHERITS (audit_log);

CREATE TABLE api_app (
	id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
	_name TEXT NOT NULL,
	_desc TEXT DEFAULT NULL,
	_tid BIGINT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	verified_at TIMESTAMP DEFAULT NULL,
	privileged BOOLEAN NOT NULL DEFAULT false,

	website TEXT NOT NULL DEFAULT '',
	url_tos TEXT DEFAULT NULL,
	url_privacy TEXT DEFAULT NULL,
	url_redirects TEXT[] NOT NULL DEFAULT '{}',
	minimum_age SMALLINT NOT NULL DEFAULT 0,
	permissions SMALLINT NOT NULL DEFAULT 1,
	secret TEXT NOT NULL,
	rate_limit SMALLINT NOT NULL DEFAULT 50,

	FOREIGN KEY (_tid) REFERENCES api_team (id) ON DELETE CASCADE
);

CREATE TABLE oauth_authz_code (
	id TEXT NOT NULL PRIMARY KEY,
	_uid UUID NOT NULL,
	_app UUID NOT NULL,
	shared_secret TEXT NOT NULL,
	_code TEXT NOT NULL,
	scopes SMALLINT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (_uid) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY (_app) REFERENCES api_app (id) ON DELETE CASCADE
);

CREATE TABLE oauth_refresh_token (
	_auth TEXT NOT NULL,

	FOREIGN KEY (_auth) REFERENCES oauth_authz_code (id) ON DELETE CASCADE
) INHERITS (tokens);

CREATE TABLE oauth_access_token (
	_uid UUID NOT NULL,
	_app UUID NOT NULL,
	refresh_token TEXT NOT NULL,

	FOREIGN KEY (_uid) REFERENCES users (id) ON DELETE CASCADE,
	FOREIGN KEY (_app) REFERENCES api_app (id) ON DELETE CASCADE,
	FOREIGN KEY (refresh_token) REFERENCES oauth_refresh_token (id) ON DELETE CASCADE
) INHERITS (tokens);

-- END OF API TABLES --

