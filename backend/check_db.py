import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
    rows = await conn.fetch("SELECT name, email, role FROM users WHERE role IN ('hro', 'chro', 'hrbp')")
    for r in rows:
        print(f"{r['role']}: {r['name']} <{r['email']}>")
    await conn.close()

asyncio.run(run())
