import asyncio
import os
import asyncpg
from dotenv import load_dotenv
from uuid import UUID

load_dotenv()

async def test_uuid():
    try:
        conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
        
        user = await conn.fetchrow("SELECT id FROM users LIMIT 1")
        uid_str = str(user['id'])
        uid_obj = user['id']
        
        print(f"Testing with string: {uid_str}")
        res1 = await conn.fetchrow("SELECT * FROM users WHERE id = $1", uid_str)
        print(f"Result with string: {'Found' if res1 else 'Not Found'}")
        
        print(f"Testing with object: {uid_obj}")
        res2 = await conn.fetchrow("SELECT * FROM users WHERE id = $1", uid_obj)
        print(f"Result with object: {'Found' if res2 else 'Not Found'}")
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_uuid())
