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

-- price_range table
CREATE TABLE IF NOT EXISTS price_range (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name varchar(100),
	min_price INTEGER NOT NULL check (min_price >= 0),
	max_price INTEGER NOT NULL check (max_price >= 0)
);

-- item table
CREATE TABLE IF NOT EXISTS item (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	price_range_id INTEGER,
	link TEXT,
	description TEXT,
	purchased INTEGER NOT NULL DEFAULT 0,
	-- Either link or description must be non-empty
	CHECK ( (link IS NOT NULL AND length(trim(link)) > 0) OR (description IS NOT NULL AND length(trim(description)) > 0) ),
	FOREIGN KEY (user_id) REFERENCES cookie_user(id) ON DELETE CASCADE,
	FOREIGN KEY (price_range_id) REFERENCES price_range(id) ON DELETE SET NULL
);

-- pod table
CREATE TABLE IF NOT EXISTS pod (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL
);

-- pod_members table (many-to-many between cookie_user and pod)
CREATE TABLE IF NOT EXISTS pod_members (
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

create table if not exists repeating_events(
	id integer primary key autoincrement,
	month_day varchar(5) not null,
	repeats_frequency int,
	foreign key (repeats_frequency) references frequency(id) on delete cascade
);