"""Insurance product marketplace."""

from __future__ import annotations

from fastapi import APIRouter, Query

router = APIRouter()

PRODUCTS = [
    {
        "id": "travel-protect-plus",
        "title": "Travel Protect Plus",
        "description": "Comprehensive travel insurance for you and your loved ones",
        "category": "Travel",
        "price_from": 25,
        "price_unit": "trip",
        "currency": "GBP",
        "rating": 4.8,
        "review_count": 230,
        "best_seller": True,
        "icon": "plane",
    },
    {
        "id": "global-explorer",
        "title": "Global Explorer",
        "description": "Multi-trip annual travel insurance",
        "category": "Travel",
        "price_from": 120,
        "price_unit": "year",
        "currency": "GBP",
        "rating": 4.6,
        "review_count": 110,
        "best_seller": False,
        "icon": "shield",
    },
    {
        "id": "trip-cancellation",
        "title": "Trip Cancellation",
        "description": "Protect your non-refundable trips",
        "category": "Travel",
        "price_from": 15,
        "price_unit": "trip",
        "currency": "GBP",
        "rating": 4.5,
        "review_count": 88,
        "best_seller": False,
        "icon": "lock",
    },
    {
        "id": "family-health",
        "title": "Family Health Cover",
        "description": "Everyday health protection for the whole family",
        "category": "Health",
        "price_from": 45,
        "price_unit": "month",
        "currency": "GBP",
        "rating": 4.7,
        "review_count": 312,
        "best_seller": True,
        "icon": "heart",
    },
    {
        "id": "motor-plus",
        "title": "Motor Plus",
        "description": "Comprehensive vehicle cover with roadside assist",
        "category": "Vehicle",
        "price_from": 38,
        "price_unit": "month",
        "currency": "GBP",
        "rating": 4.4,
        "review_count": 190,
        "best_seller": False,
        "icon": "car",
    },
    {
        "id": "home-shield",
        "title": "Home Shield",
        "description": "Buildings and contents protection for your property",
        "category": "Property",
        "price_from": 22,
        "price_unit": "month",
        "currency": "GBP",
        "rating": 4.9,
        "review_count": 401,
        "best_seller": True,
        "icon": "home",
    },
]

CATEGORIES = ["All", "Travel", "Health", "Vehicle", "Property"]


@router.get("")
def list_products(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> dict:
    items = PRODUCTS
    if category and category.lower() != "all":
        items = [p for p in items if p["category"].lower() == category.lower()]
    if q:
        needle = q.lower()
        items = [
            p
            for p in items
            if needle in p["title"].lower() or needle in p["description"].lower()
        ]
    return {"categories": CATEGORIES, "products": items}
