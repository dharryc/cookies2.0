def db_migration(db):
    # Add is_admin column to cookie_user table
    try:
        db.execute('ALTER TABLE cookie_user ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;')
    except Exception as e:
        err_msg = str(e)
        if 'duplicate column name' in err_msg:
            print('is_admin column already exists, skipping migration')
        else:
            print('Migration error:', e)
            raise
    else:
        print('Successfully added is_admin column')

    try:
        db.execute('ALTER TABLE cookie_user ADD COLUMN item_priority INTEGER NOT NULL DEFAULT 0;')
    except Exception as e:
        err_msg = str(e)
        if 'duplicate column name' in err_msg:
            print('item_priority column already exists, skipping migration')
        else:
            print('Migration error:', e)
            raise
    else:
        print('Successfully added item_priority column')
