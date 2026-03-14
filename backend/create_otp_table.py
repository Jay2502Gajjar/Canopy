import asyncio, asyncpg, os
from dotenv import load_dotenv
load_dotenv()

async def run():
    conn = await asyncpg.connect(os.getenv('POSTGRES_URL'))
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS otp_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_otp_codes_user ON otp_codes(user_id);
    ''')
    print("OTP table created!")
    await conn.close()

asyncio.run(run())
