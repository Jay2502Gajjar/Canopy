import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
    
    # Update HRO name to Jay Gajjar
    await conn.execute("UPDATE users SET name = 'Jay Gajjar', first_name = 'Jay' WHERE role = 'hro'")
    
    # Check all HR users
    rows = await conn.fetch("SELECT name, email, role FROM users WHERE role IN ('hro', 'chro', 'hrbp')")
    print("\n--- Current HR Profiles ---")
    for r in rows:
        print(f"{r['role']}: {r['name']} <{r['email']}>")
    
    await conn.close()

asyncio.run(run())
