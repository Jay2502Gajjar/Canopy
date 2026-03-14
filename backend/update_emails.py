import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
    await conn.execute("UPDATE users SET email = 'jaygajjar2502@gmail.com' WHERE role = 'hro'")
    await conn.execute("UPDATE users SET email = 'jaygajjar445@gmail.com' WHERE role = 'chro'")
    await conn.execute("UPDATE users SET email = 'jaygajjar2521@gmail.com' WHERE role = 'hrbp'")
    await conn.close()
    print("Mails updated successfully")

asyncio.run(run())
