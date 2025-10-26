# heuristics.py

HEURISTIC_TIME_SPENT = {
    "museum": [120, 180],
    "art_gallery": [60, 120],
    "restaurant": [60, 90],
    "cafe": [30, 60],
    "shopping_mall": [90, 180],
    "library": [60, 180],
    "park": [60, 120],
    "zoo": [120, 240],
    "aquarium": [90, 180],
    "movie_theater": [120, 180],
    "gym": [60, 120],
    "bar": [60, 120],
    "stadium": [120, 240],
    "casino": [90, 240],
    "spa": [90, 180],
    "church": [30, 90],
    "amusement_park": [180, 360],
    "night_club": [90, 240],
}

def heuristic_time_spent(types: list) -> tuple:
    """
    Returns heuristic default times and a status message.
    """
    for place_type in types:
        if place_type in HEURISTIC_TIME_SPENT:
            return HEURISTIC_TIME_SPENT[place_type], "Heuristic"

    # Default generic fallback
    return [30, 60], "Default"
