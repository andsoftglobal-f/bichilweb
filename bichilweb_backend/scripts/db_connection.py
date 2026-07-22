"""
Shared database connection helper.
Reads credentials from .env file in bichilweb_backend root.
"""
import os
import psycopg2
import environ

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))


def get_connection(autocommit=False):
    conn = psycopg2.connect(
        host=env("DB_HOST", default="localhost"),
        port=env.int("DB_PORT", default=5432),
        dbname=env("DB_NAME", default="bichilglobus"),
        user=env("DB_USER", default="bichilweb"),
        password=env("DB_PASSWORD", default=""),
        options="-c search_path=bichilweb",
    )
    if autocommit:
        conn.autocommit = True
    return conn
