"""SDK-specific exceptions."""


class GCULError(Exception):
    """Base error for the GCUL SDK."""


class AuthenticationError(GCULError):
    """Raised when Google Cloud credentials cannot be obtained."""


class SigningError(GCULError):
    """Raised when a transaction cannot be signed."""


class TransactionError(GCULError):
    """Raised when a submitted or queried transaction failed."""

    def __init__(self, message: str, *, code: int | None = None, digest: str | None = None):
        super().__init__(message)
        self.code = code
        self.digest = digest


class TransactionTimeoutError(GCULError):
    """Raised when waiting for a transaction to finalize times out."""
