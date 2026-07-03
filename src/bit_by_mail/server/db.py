import sqlite3

def init_db(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, name TEXT, smtp_server TEXT, smtp_port INTEGER, sender_email TEXT, sender_password TEXT, use_ssl BOOLEAN, is_default BOOLEAN)")
    c.execute("CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, name TEXT, subject TEXT, attachment_folder TEXT, send_attachments BOOLEAN, sender_account_id TEXT, is_html BOOLEAN, delay INTEGER, created_at TEXT, source_db_id TEXT, body TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS campaign_recipients (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id TEXT, name TEXT, email TEXT, attachment_file TEXT, status TEXT, sent_timestamp TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS databases (id TEXT PRIMARY KEY, name TEXT, created_at TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS database_recipients (id INTEGER PRIMARY KEY AUTOINCREMENT, db_id TEXT, name TEXT, email TEXT, attachment_file TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS global_templates (id TEXT PRIMARY KEY, name TEXT, category TEXT, subject TEXT, body TEXT, is_html BOOLEAN, created_at TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, url TEXT, is_gdrive BOOLEAN, created_at TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS campaign_events (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id TEXT, recipient_email TEXT, event_type TEXT, event_data TEXT, created_at TEXT)")
    cols = [r[1] for r in c.execute("PRAGMA table_info(accounts)").fetchall()]
    if "sender_password" not in cols:
        c.execute("ALTER TABLE accounts ADD COLUMN sender_password TEXT")
        c.execute("UPDATE accounts SET sender_password = ''")
    conn.commit()
    conn.close()
