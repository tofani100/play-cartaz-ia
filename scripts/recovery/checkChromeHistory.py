import sqlite3
import shutil
import os

src = r'C:\Users\Samsung\AppData\Local\Google\Chrome\User Data\Profile 4\History'
dst = r'C:\Users\Samsung\.gemini\antigravity\scratch\play-cartaz-ia\History_copy'

try:
    shutil.copy2(src, dst)
    conn = sqlite3.connect(dst)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT url, title, datetime(last_visit_time/1000000-11644473600, 'unixepoch', 'localtime') as visit_time
        FROM urls
        ORDER BY last_visit_time DESC
        LIMIT 30
    """)
    for row in cursor.fetchall():
        print(f"[{row[2]}] {row[1]}: {row[0]}")
    conn.close()
    os.remove(dst)
except Exception as e:
    print('Error:', e)
