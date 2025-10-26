from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from populartimes import get_id
import asyncio
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import os

from utils.heuristicAverageTime import heuristic_time_spent

# Import heuristic logic

load_dotenv()
app = FastAPI()

class PlaceIDsRequest(BaseModel):
    place_ids: List[str]

executor = ThreadPoolExecutor(max_workers=10)

async def fetch_popular_time(api_key: str, place_id: str):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, get_id, api_key, place_id)

    if not isinstance(data, dict):
        raise ValueError("Invalid response from get_id")

    time_spent = data.get("time_spent", [])
    types = data.get("types", [])

    if time_spent:
        message = "Google API"
    else:
        # Use heuristic fallback
        time_spent, message = heuristic_time_spent(types)

    return {
        "place_id": place_id,
        "name": data.get("name", ""),
        "time_spent": time_spent,
        "message": message
    }

@app.post("/visit-time")
async def get_visit_times(request: PlaceIDsRequest):
    api_key = os.getenv("GOOGLE_API_KEY")

    tasks = [fetch_popular_time(api_key, place_id) for place_id in request.place_ids]

    results = await asyncio.gather(*[
        asyncio.create_task(task) for task in tasks
    ], return_exceptions=True)

    final_results = []
    for place_id, result in zip(request.place_ids, results):
        if isinstance(result, Exception):
            error_msg = f"Internal server error: {str(result)}"
            print(f"Server Error: {result}")
            final_results.append({
                "place_id": place_id,
                "error": error_msg,
                "message": "Error occurred during processing"
            })
        else:
            final_results.append(result)

    return {"status": "success", "data": final_results}
