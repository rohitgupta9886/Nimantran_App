import sqlite3
import os

db_paths = ["nimantran.db", "backend/nimantran.db"]

for db_path in db_paths:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Add accepts_digital_shagun to events if missing
        try:
            cursor.execute("ALTER TABLE events ADD COLUMN accepts_digital_shagun BOOLEAN DEFAULT 0;")
            print(f"Added accepts_digital_shagun to {db_path}")
        except Exception as e:
            print(f"accepts_digital_shagun column already exists in {db_path}: {e}")

        # Add host_upi_mobile to events if missing
        try:
            cursor.execute("ALTER TABLE events ADD COLUMN host_upi_mobile VARCHAR;")
            print(f"Added host_upi_mobile to {db_path}")
        except Exception as e:
            print(f"host_upi_mobile column already exists in {db_path}: {e}")

        # Add check_in_method to checkins if missing
        try:
            cursor.execute("ALTER TABLE checkins ADD COLUMN check_in_method VARCHAR DEFAULT 'QR_SCAN';")
            print(f"Added check_in_method to {db_path}")
        except Exception as e:
            print(f"check_in_method column already exists in {db_path}: {e}")

        conn.commit()
        conn.close()
