import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

# We will store the connection pool globally
pool = None

async def init_db():
    global pool
    try:
        pool = await asyncpg.create_pool(
            dsn=os.getenv("POSTGRES_URL"),
            min_size=1,
            max_size=10,
            command_timeout=60,
        )
        print("Connected to PostgreSQL (Neon)")
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        raise e

async def close_db():
    global pool
    if pool is not None:
        await pool.close()
        print("PostgreSQL connection closed")

# Dependency to get a connection from the pool
async def get_db():
    if pool is None:
        raise Exception("Database pool not initialized")
    async with pool.acquire() as connection:
        yield connection
