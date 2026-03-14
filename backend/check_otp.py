import asyncio
import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

async def check_otp():
    try:
        conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
        
        user = await conn.fetchrow("SELECT id, name, email FROM users WHERE name ILIKE '%Sarah%'")
        if user:
            print(f"Found user: {user['name']} ({user['id']})")
            
            otps = await conn.fetch("SELECT * FROM otp_codes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", user['id'])
            print(f"\nOTPs for {user['name']}:")
            for otp in otps:
                print(f"ID: {otp['id']}, Code: {otp['code']}, Expires: {otp['expires_at']}, Used: {otp['used']}")
        else:
            print("User Sarah not found")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_otp())
