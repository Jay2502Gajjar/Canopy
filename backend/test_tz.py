import asyncio
import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv()

async def test_timezone():
    try:
        conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
        
        # Current local DB time
        db_now = await conn.fetchval("SELECT NOW()")
        print(f"Postgres NOW(): {db_now}")
        
        # Naive UTC
        naive_utc = datetime.utcnow()
        print(f"Python datetime.utcnow() (naive): {naive_utc}")
        
        # Aware UTC
        aware_utc = datetime.now(timezone.utc)
        print(f"Python datetime.now(timezone.utc) (aware): {aware_utc}")
        
        # Test insertion
        await conn.execute("CREATE TEMP TABLE tz_test (t TIMESTAMPTZ)")
        await conn.execute("INSERT INTO tz_test (t) VALUES ($1)", naive_utc)
        stored_naive = await conn.fetchval("SELECT t FROM tz_test")
        print(f"Stored naive UTC in TIMESTAMPTZ: {stored_naive}")
        
        await conn.execute("DELETE FROM tz_test")
        await conn.execute("INSERT INTO tz_test (t) VALUES ($1)", aware_utc)
        stored_aware = await conn.fetchval("SELECT t FROM tz_test")
        print(f"Stored aware UTC in TIMESTAMPTZ: {stored_aware}")
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_timezone())
