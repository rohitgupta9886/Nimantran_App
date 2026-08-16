import sqlite3
import os
import uuid
from datetime import datetime, timezone
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("About", (), {"__version__": getattr(bcrypt, "__version__", "4.1.0")})()
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("AdminSecurePass2026!")

db_paths = ["nimantran.db", "backend/nimantran.db"]
admin_email = "rohitgupta9886@gmail.com"

for db_path in db_paths:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Ensure new columns in users table
        for col_name, col_type in [
            ("last_login_at", "DATETIME"),
            ("is_deleted", "BOOLEAN DEFAULT 0"),
        ]:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
            except Exception:
                pass

        # Ensure new columns in audit_logs table
        for col_name, col_type in [
            ("actor_name", "VARCHAR"),
            ("actor_role", "VARCHAR"),
            ("target_type", "VARCHAR"),
            ("target_id", "VARCHAR"),
        ]:
            try:
                cursor.execute(f"ALTER TABLE audit_logs ADD COLUMN {col_name} {col_type};")
            except Exception:
                pass

        # Check if user exists
        cursor.execute("SELECT id, role, is_superuser, is_active FROM users WHERE email = ?", (admin_email,))
        row = cursor.fetchone()
        now_str = datetime.now(timezone.utc).isoformat()

        if row:
            cursor.execute("""
                UPDATE users
                SET role = 'ADMIN',
                    is_superuser = 1,
                    is_active = 1,
                    is_deleted = 0,
                    hashed_password = ?,
                    full_name = 'Rohit Gupta (Master Admin)'
                WHERE email = ?
            """, (hashed, admin_email))
            print(f"Updated {admin_email} in {db_path} to ADMIN / superuser=1")
        else:
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, is_deleted, is_superuser, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'ADMIN', 1, 0, 1, ?, ?)
            """, (user_id, admin_email, hashed, "Rohit Gupta (Master Admin)", "+919886000000", now_str, now_str))
            print(f"Inserted {admin_email} into {db_path} as ADMIN")

            # Create wallet
            wallet_id = str(uuid.uuid4())
            try:
                cursor.execute("""
                    INSERT INTO credit_wallets (id, user_id, balance, created_at, updated_at)
                    VALUES (?, ?, 99999, ?, ?)
                """, (wallet_id, user_id, now_str, now_str))
            except Exception:
                pass

        conn.commit()
        conn.close()

print("Admin bootstrap complete.")
