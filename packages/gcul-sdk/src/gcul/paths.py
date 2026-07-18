"""Resource name helpers for Universal Ledger endpoints."""


def location_path(project: str, location: str) -> str:
    """Return ``projects/{project}/locations/{location}``."""
    return f"projects/{project}/locations/{location}"


def endpoint_path(project: str, location: str, endpoint: str) -> str:
    """Return ``projects/{project}/locations/{location}/endpoints/{endpoint}``."""
    return f"projects/{project}/locations/{location}/endpoints/{endpoint}"
