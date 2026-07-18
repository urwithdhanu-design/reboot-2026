from google.api import annotations_pb2 as _annotations_pb2
from google.api import client_pb2 as _client_pb2
from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.api import resource_pb2 as _resource_pb2
from google.cloud.universalledger.v1 import query_pb2 as _query_pb2
from google.cloud.universalledger.v1 import types_pb2 as _types_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Endpoint(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class ListEndpointsRequest(_message.Message):
    __slots__ = ("parent", "page_size", "page_token")
    PARENT_FIELD_NUMBER: _ClassVar[int]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    PAGE_TOKEN_FIELD_NUMBER: _ClassVar[int]
    parent: str
    page_size: int
    page_token: str
    def __init__(self, parent: _Optional[str] = ..., page_size: _Optional[int] = ..., page_token: _Optional[str] = ...) -> None: ...

class ListEndpointsResponse(_message.Message):
    __slots__ = ("endpoints", "next_page_token")
    ENDPOINTS_FIELD_NUMBER: _ClassVar[int]
    NEXT_PAGE_TOKEN_FIELD_NUMBER: _ClassVar[int]
    endpoints: _containers.RepeatedCompositeFieldContainer[Endpoint]
    next_page_token: str
    def __init__(self, endpoints: _Optional[_Iterable[_Union[Endpoint, _Mapping]]] = ..., next_page_token: _Optional[str] = ...) -> None: ...

class GetEndpointRequest(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class QueryAccountRequest(_message.Message):
    __slots__ = ("endpoint", "account_id", "round_id")
    ENDPOINT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_ID_FIELD_NUMBER: _ClassVar[int]
    ROUND_ID_FIELD_NUMBER: _ClassVar[int]
    endpoint: str
    account_id: str
    round_id: int
    def __init__(self, endpoint: _Optional[str] = ..., account_id: _Optional[str] = ..., round_id: _Optional[int] = ...) -> None: ...

class QueryAccountResponse(_message.Message):
    __slots__ = ("account",)
    ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    account: _query_pb2.Account
    def __init__(self, account: _Optional[_Union[_query_pb2.Account, _Mapping]] = ...) -> None: ...

class SubmitTransactionRequest(_message.Message):
    __slots__ = ("endpoint", "serialized_signed_transaction")
    ENDPOINT_FIELD_NUMBER: _ClassVar[int]
    SERIALIZED_SIGNED_TRANSACTION_FIELD_NUMBER: _ClassVar[int]
    endpoint: str
    serialized_signed_transaction: bytes
    def __init__(self, endpoint: _Optional[str] = ..., serialized_signed_transaction: _Optional[bytes] = ...) -> None: ...

class SubmitTransactionResponse(_message.Message):
    __slots__ = ("transaction_digest_hex",)
    TRANSACTION_DIGEST_HEX_FIELD_NUMBER: _ClassVar[int]
    transaction_digest_hex: str
    def __init__(self, transaction_digest_hex: _Optional[str] = ...) -> None: ...

class SubmitOperationalTransactionRequest(_message.Message):
    __slots__ = ("endpoint", "serialized_signed_operational_transaction")
    ENDPOINT_FIELD_NUMBER: _ClassVar[int]
    SERIALIZED_SIGNED_OPERATIONAL_TRANSACTION_FIELD_NUMBER: _ClassVar[int]
    endpoint: str
    serialized_signed_operational_transaction: bytes
    def __init__(self, endpoint: _Optional[str] = ..., serialized_signed_operational_transaction: _Optional[bytes] = ...) -> None: ...

class SubmitOperationalTransactionResponse(_message.Message):
    __slots__ = ("transaction_digest_hex",)
    TRANSACTION_DIGEST_HEX_FIELD_NUMBER: _ClassVar[int]
    transaction_digest_hex: str
    def __init__(self, transaction_digest_hex: _Optional[str] = ...) -> None: ...

class QueryTransactionStateRequest(_message.Message):
    __slots__ = ("endpoint", "transaction_digest_hex")
    ENDPOINT_FIELD_NUMBER: _ClassVar[int]
    TRANSACTION_DIGEST_HEX_FIELD_NUMBER: _ClassVar[int]
    endpoint: str
    transaction_digest_hex: str
    def __init__(self, endpoint: _Optional[str] = ..., transaction_digest_hex: _Optional[str] = ...) -> None: ...

class QueryTransactionStateResponse(_message.Message):
    __slots__ = ("transaction_attempts",)
    TRANSACTION_ATTEMPTS_FIELD_NUMBER: _ClassVar[int]
    transaction_attempts: _containers.RepeatedCompositeFieldContainer[_types_pb2.TransactionAttempt]
    def __init__(self, transaction_attempts: _Optional[_Iterable[_Union[_types_pb2.TransactionAttempt, _Mapping]]] = ...) -> None: ...
