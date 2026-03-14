import asyncio
import os
import asyncpg
import bcrypt
from dotenv import load_dotenv

load_dotenv()

async def run():
    pool = await asyncpg.create_pool(os.getenv('POSTGRES_URL'))
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT email, password_hash FROM users")
        for r in records:
            email = r['email']
            phash = r['password_hash']
            try:
                ok = bcrypt.checkpw(b'admin123', phash.encode('utf-8'))
                print(f"{email}: {ok}")
            except Exception as e:
                print(f"{email}: ERROR {e} hash={phash}")
    await pool.close()

asyncio.run(run())
