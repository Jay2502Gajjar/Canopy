import logging
from db.database import get_db

logger = logging.getLogger("canopy-backend")

async def log_event(event_type: str, description: str, employee_id: str = None, employee_name: str = None):
    # Obtain a connection manually since this isn't a FastAPI route
    from db.database import pool
    
    if not pool:
        logger.error("Database pool not available for logging activity")
        return
        
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO recent_changes (event_type, description, employee_id, employee_name) 
                VALUES ($1, $2, $3, $4)
                """,
                event_type, description, employee_id, employee_name
            )
            logger.info(f"Logged recent change: {event_type} - {employee_name}")
    except Exception as e:
        logger.error(f"Failed to log recent change: {e}")
