PRAGMA foreign_keys = ON;

-- cookie_user table
CREATE TABLE IF NOT EXISTS cookie_user (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username varchar(100) NOT NULL UNIQUE,
	first_name varchar(100) NOT NULL,
	surname varchar(100) NOT NULL,
	hashed_password text NOT NULL,
	birthday date
);

-- item table
CREATE TABLE IF NOT EXISTS item (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	item_name TEXT NOT NULL,
	user_id INTEGER NOT NULL,
	upper_price INTEGER NOT NULL check (upper_price >= 0),
	lower_price INTEGER NOT NULL check (lower_price >= 0),
	link TEXT,
	description TEXT,
	purchased INTEGER NOT NULL DEFAULT 0,
	-- Either link or description must be non-empty
	CHECK ( (link IS NOT NULL AND length(trim(link)) > 0) OR (description IS NOT NULL AND length(trim(description)) > 0) ),
	FOREIGN KEY (user_id) REFERENCES cookie_user(id) ON DELETE CASCADE
);

-- pod table
CREATE TABLE IF NOT EXISTS pod (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	owner_id INTEGER NOT NULL,
	FOREIGN KEY (owner_id) REFERENCES cookie_user(id) ON DELETE CASCADE
);

-- pod_members table (many-to-many between cookie_user and pod)
CREATE TABLE IF NOT EXISTS pod_member (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	pod_id INTEGER NOT NULL,
	UNIQUE(user_id, pod_id),
	FOREIGN KEY (user_id) REFERENCES cookie_user(id) ON DELETE CASCADE,
	FOREIGN KEY (pod_id) REFERENCES pod(id) ON DELETE CASCADE
);

-- item_in_pod table (which item are visible to which pod)
CREATE TABLE IF NOT EXISTS item_in_pod (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	item_id INTEGER NOT NULL,
	pod_id INTEGER NOT NULL,
	purchased_by INTEGER,
	UNIQUE(item_id, pod_id),
	FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE,
	FOREIGN KEY (pod_id) REFERENCES pod(id) ON DELETE CASCADE,
	FOREIGN KEY (purchased_by) REFERENCES cookie_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pod_invite (
    code TEXT PRIMARY KEY,
    pod_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (pod_id) REFERENCES pod(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES cookie_user(id) ON DELETE CASCADE
);