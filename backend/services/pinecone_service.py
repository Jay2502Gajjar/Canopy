import os
import math
import logging
from pinecone import Pinecone

logger = logging.getLogger("canopy-backend")

pinecone_client = None
pinecone_index = None

INDEX_NAME = os.getenv("PINECONE_INDEX", "canopy-hr")

async def init_pinecone():
    global pinecone_client, pinecone_index
    try:
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            logger.warning("PINECONE_API_KEY not set - AI memory features disabled")
            return None

        pinecone_client = Pinecone(api_key=api_key)
        pinecone_index = pinecone_client.Index(INDEX_NAME)
        logger.info(f"Pinecone initialized (index: {INDEX_NAME})")
        return pinecone_index
    except Exception as e:
        logger.warning(f"Pinecone initialization failed - running without vector memory: {e}")
        return None

def text_to_vector(text: str, dimensions: int = 384) -> list[float]:
    """
    Generate a simple numeric vector from text (lightweight demo embedding)
    Matches the deterministic JS logic from chroma.service.js
    """
    vector = [0.0] * dimensions
    normalized = text.lower()
    for i, char in enumerate(normalized):
        char_code = ord(char)
        idx = (char_code * (i + 1)) % dimensions
        vector[idx] += 1.0 / (1 + (i // dimensions))
        
    # Normalize
    magnitude = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / magnitude for v in vector]

async def add_memory(id_prefix: str, document: str, metadata: dict = None):
    global pinecone_index
    try:
        if pinecone_index is None:
            await init_pinecone()
        if pinecone_index is None:
            return None
            
        vector = text_to_vector(document)
        if metadata is None:
            metadata = {}
            
        meta = metadata.copy()
        meta["text"] = document[:1000]
        
        # Note: synchronous call wrapped or just standard pinecone-client call
        # pinecone python client operations are mostly synchronous but we wrap in async for FastAPI
        pinecone_index.upsert(
            vectors=[{
                "id": id_prefix,
                "values": vector,
                "metadata": meta
            }]
        )
        logger.info(f"Memory added to Pinecone: {id_prefix}")
        return True
    except Exception as e:
        logger.error(f"Failed to add memory to Pinecone: {e}")
        return None

async def search_memory(query_text: str, top_k: int = 5, filter_dict: dict = None):
    global pinecone_index
    try:
        if pinecone_index is None:
            await init_pinecone()
        if pinecone_index is None:
            return []
            
        vector = text_to_vector(query_text)
        
        kwargs = {
            "vector": vector,
            "top_k": top_k,
            "include_metadata": True
        }
        if filter_dict:
            kwargs["filter"] = filter_dict
            
        results = pinecone_index.query(**kwargs)
        
        matches = []
        for m in getattr(results, "matches", []):
            matches.append({
                "document": m.metadata.get("text", "") if hasattr(m, "metadata") else "",
                "metadata": m.metadata if hasattr(m, "metadata") else {},
                "score": getattr(m, "score", 0)
            })
        return matches
    except Exception as e:
        logger.error(f"Pinecone search failed: {e}")
        return []

async def delete_memory(id_val: str):
    global pinecone_index
    try:
        if pinecone_index is None:
            await init_pinecone()
        if pinecone_index is None:
            return None
            
        pinecone_index.delete(ids=[id_val])
        logger.info(f"Memory deleted from Pinecone: {id_val}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete memory: {e}")
        return None

async def delete_employee_memory(employee_id: str):
    global pinecone_index
    try:
        if pinecone_index is None:
            await init_pinecone()
        if pinecone_index is None:
            return None
            
        pinecone_index.delete(filter={"employee_id": {"$eq": employee_id}})
        logger.info(f"Employee memories deleted: {employee_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete employee memory: {e}")
        return None
