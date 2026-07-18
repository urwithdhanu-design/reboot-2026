from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.cloud.universalledger.v1 import accounts_pb2 as _accounts_pb2
from google.cloud.universalledger.v1 import common_pb2 as _common_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SettlementMode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SETTLEMENT_MODE_UNSPECIFIED: _ClassVar[SettlementMode]
    SETTLEMENT_MODE_DEFERRED: _ClassVar[SettlementMode]
    SETTLEMENT_MODE_INSTANT: _ClassVar[SettlementMode]

class KeyFormat(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    KEY_FORMAT_UNSPECIFIED: _ClassVar[KeyFormat]
    KEY_FORMAT_TINK_WIRE_FORMAT: _ClassVar[KeyFormat]
    KEY_FORMAT_PEM_EC_P256_SHA256: _ClassVar[KeyFormat]
SETTLEMENT_MODE_UNSPECIFIED: SettlementMode
SETTLEMENT_MODE_DEFERRED: SettlementMode
SETTLEMENT_MODE_INSTANT: SettlementMode
KEY_FORMAT_UNSPECIFIED: KeyFormat
KEY_FORMAT_TINK_WIRE_FORMAT: KeyFormat
KEY_FORMAT_PEM_EC_P256_SHA256: KeyFormat

class SettlementRequest(_message.Message):
    __slots__ = ("payer", "payer_id", "beneficiary", "beneficiary_id", "balance", "round_id")
    PAYER_FIELD_NUMBER: _ClassVar[int]
    PAYER_ID_FIELD_NUMBER: _ClassVar[int]
    BENEFICIARY_FIELD_NUMBER: _ClassVar[int]
    BENEFICIARY_ID_FIELD_NUMBER: _ClassVar[int]
    BALANCE_FIELD_NUMBER: _ClassVar[int]
    ROUND_ID_FIELD_NUMBER: _ClassVar[int]
    payer: _common_pb2.Entity
    payer_id: str
    beneficiary: _common_pb2.Entity
    beneficiary_id: str
    balance: _common_pb2.CurrencyValue
    round_id: int
    def __init__(self, payer: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., payer_id: _Optional[str] = ..., beneficiary: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., beneficiary_id: _Optional[str] = ..., balance: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., round_id: _Optional[int] = ...) -> None: ...

class CreateAccount(_message.Message):
    __slots__ = ("public_key", "key_format", "roles", "account_status", "account_comment", "token_manager", "token_manager_id")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_STATUS_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    roles: _containers.RepeatedScalarFieldContainer[_accounts_pb2.Role]
    account_status: _accounts_pb2.AccountStatus
    account_comment: str
    token_manager: _common_pb2.Entity
    token_manager_id: str
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., roles: _Optional[_Iterable[_Union[_accounts_pb2.Role, str]]] = ..., account_status: _Optional[_Union[_accounts_pb2.AccountStatus, str]] = ..., account_comment: _Optional[str] = ..., token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., token_manager_id: _Optional[str] = ...) -> None: ...

class DeactivateAccount(_message.Message):
    __slots__ = ("account", "account_id")
    ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_ID_FIELD_NUMBER: _ClassVar[int]
    account: _common_pb2.Entity
    account_id: str
    def __init__(self, account: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., account_id: _Optional[str] = ...) -> None: ...

class ActivateAccount(_message.Message):
    __slots__ = ("account", "account_id")
    ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_ID_FIELD_NUMBER: _ClassVar[int]
    account: _common_pb2.Entity
    account_id: str
    def __init__(self, account: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., account_id: _Optional[str] = ...) -> None: ...

class AddRoles(_message.Message):
    __slots__ = ("account", "account_id", "roles")
    ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_ID_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    account: _common_pb2.Entity
    account_id: str
    roles: _containers.RepeatedScalarFieldContainer[_accounts_pb2.Role]
    def __init__(self, account: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., account_id: _Optional[str] = ..., roles: _Optional[_Iterable[_Union[_accounts_pb2.Role, str]]] = ...) -> None: ...

class RemoveRoles(_message.Message):
    __slots__ = ("account", "account_id", "roles")
    ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_ID_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    account: _common_pb2.Entity
    account_id: str
    roles: _containers.RepeatedScalarFieldContainer[_accounts_pb2.Role]
    def __init__(self, account: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., account_id: _Optional[str] = ..., roles: _Optional[_Iterable[_Union[_accounts_pb2.Role, str]]] = ...) -> None: ...

class ChangeAccountManager(_message.Message):
    __slots__ = ("account", "account_id", "next_manager", "next_manager_id")
    ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_ID_FIELD_NUMBER: _ClassVar[int]
    NEXT_MANAGER_FIELD_NUMBER: _ClassVar[int]
    NEXT_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    account: _common_pb2.Entity
    account_id: str
    next_manager: _common_pb2.Entity
    next_manager_id: str
    def __init__(self, account: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., account_id: _Optional[str] = ..., next_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., next_manager_id: _Optional[str] = ...) -> None: ...

class IncreaseTokenIssuanceLimit(_message.Message):
    __slots__ = ("token_manager", "token_manager_id", "amount")
    TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_FIELD_NUMBER: _ClassVar[int]
    token_manager: _common_pb2.Entity
    token_manager_id: str
    amount: _common_pb2.CurrencyValue
    def __init__(self, token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., token_manager_id: _Optional[str] = ..., amount: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...

class DecreaseTokenIssuanceLimit(_message.Message):
    __slots__ = ("token_manager", "token_manager_id", "amount")
    TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_FIELD_NUMBER: _ClassVar[int]
    token_manager: _common_pb2.Entity
    token_manager_id: str
    amount: _common_pb2.CurrencyValue
    def __init__(self, token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., token_manager_id: _Optional[str] = ..., amount: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...

class Mint(_message.Message):
    __slots__ = ("mint_amount", "beneficiary", "beneficiary_id")
    MINT_AMOUNT_FIELD_NUMBER: _ClassVar[int]
    BENEFICIARY_FIELD_NUMBER: _ClassVar[int]
    BENEFICIARY_ID_FIELD_NUMBER: _ClassVar[int]
    mint_amount: _common_pb2.CurrencyValue
    beneficiary: _common_pb2.Entity
    beneficiary_id: str
    def __init__(self, mint_amount: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., beneficiary: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., beneficiary_id: _Optional[str] = ...) -> None: ...

class Burn(_message.Message):
    __slots__ = ("burn_amount", "payer", "payer_id")
    BURN_AMOUNT_FIELD_NUMBER: _ClassVar[int]
    PAYER_FIELD_NUMBER: _ClassVar[int]
    PAYER_ID_FIELD_NUMBER: _ClassVar[int]
    burn_amount: _common_pb2.CurrencyValue
    payer: _common_pb2.Entity
    payer_id: str
    def __init__(self, burn_amount: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., payer: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., payer_id: _Optional[str] = ...) -> None: ...

class Transfer(_message.Message):
    __slots__ = ("beneficiary", "beneficiary_id", "amount")
    BENEFICIARY_FIELD_NUMBER: _ClassVar[int]
    BENEFICIARY_ID_FIELD_NUMBER: _ClassVar[int]
    AMOUNT_FIELD_NUMBER: _ClassVar[int]
    beneficiary: _common_pb2.Entity
    beneficiary_id: str
    amount: _common_pb2.CurrencyValue
    def __init__(self, beneficiary: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., beneficiary_id: _Optional[str] = ..., amount: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...

class CreateTokenManager(_message.Message):
    __slots__ = ("public_key", "key_format", "account_comment")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    account_comment: str
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., account_comment: _Optional[str] = ...) -> None: ...

class CreateAccountManager(_message.Message):
    __slots__ = ("public_key", "key_format", "default_token_manager", "default_token_manager_id", "account_comment")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    DEFAULT_TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    DEFAULT_TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    default_token_manager: _common_pb2.Entity
    default_token_manager_id: str
    account_comment: str
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., default_token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., default_token_manager_id: _Optional[str] = ..., account_comment: _Optional[str] = ...) -> None: ...

class CreateClearinghouse(_message.Message):
    __slots__ = ("public_key", "key_format", "account_comment", "settlement_mode")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    SETTLEMENT_MODE_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    account_comment: str
    settlement_mode: SettlementMode
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., account_comment: _Optional[str] = ..., settlement_mode: _Optional[_Union[SettlementMode, str]] = ...) -> None: ...

class TransferPlatformOperator(_message.Message):
    __slots__ = ("public_key", "key_format", "account_comment")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    account_comment: str
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., account_comment: _Optional[str] = ...) -> None: ...

class CreateCurrencyOperator(_message.Message):
    __slots__ = ("public_key", "key_format", "account_comment", "currency", "currency_code")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_CODE_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    account_comment: str
    currency: str
    currency_code: str
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., account_comment: _Optional[str] = ..., currency: _Optional[str] = ..., currency_code: _Optional[str] = ...) -> None: ...

class TransferCurrencyOperator(_message.Message):
    __slots__ = ("public_key", "key_format", "account_comment", "currency_operator", "currency_operator_id")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_OPERATOR_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_OPERATOR_ID_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    key_format: KeyFormat
    account_comment: str
    currency_operator: _common_pb2.Entity
    currency_operator_id: str
    def __init__(self, public_key: _Optional[bytes] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ..., account_comment: _Optional[str] = ..., currency_operator: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., currency_operator_id: _Optional[str] = ...) -> None: ...

class CreateSnapshot(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class CreateContract(_message.Message):
    __slots__ = ("contract_bytes", "arguments", "init_arguments", "contract_comment")
    class ArgumentsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _common_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_common_pb2.Value, _Mapping]] = ...) -> None: ...
    class InitArgumentsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _common_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_common_pb2.Value, _Mapping]] = ...) -> None: ...
    CONTRACT_BYTES_FIELD_NUMBER: _ClassVar[int]
    ARGUMENTS_FIELD_NUMBER: _ClassVar[int]
    INIT_ARGUMENTS_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    contract_bytes: bytes
    arguments: _containers.MessageMap[str, _common_pb2.Value]
    init_arguments: _containers.MessageMap[str, _common_pb2.Value]
    contract_comment: str
    def __init__(self, contract_bytes: _Optional[bytes] = ..., arguments: _Optional[_Mapping[str, _common_pb2.Value]] = ..., init_arguments: _Optional[_Mapping[str, _common_pb2.Value]] = ..., contract_comment: _Optional[str] = ...) -> None: ...

class GrantContractPermissions(_message.Message):
    __slots__ = ("contract", "contract_id", "permissions")
    CONTRACT_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_ID_FIELD_NUMBER: _ClassVar[int]
    PERMISSIONS_FIELD_NUMBER: _ClassVar[int]
    contract: _common_pb2.Entity
    contract_id: str
    permissions: _containers.RepeatedScalarFieldContainer[_accounts_pb2.ContractPermission]
    def __init__(self, contract: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., contract_id: _Optional[str] = ..., permissions: _Optional[_Iterable[_Union[_accounts_pb2.ContractPermission, str]]] = ...) -> None: ...

class InvokeContractMethod(_message.Message):
    __slots__ = ("contract", "contract_id", "method_name", "arguments", "method_arguments", "payment")
    class ArgumentsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _common_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_common_pb2.Value, _Mapping]] = ...) -> None: ...
    class MethodArgumentsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _common_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_common_pb2.Value, _Mapping]] = ...) -> None: ...
    CONTRACT_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_ID_FIELD_NUMBER: _ClassVar[int]
    METHOD_NAME_FIELD_NUMBER: _ClassVar[int]
    ARGUMENTS_FIELD_NUMBER: _ClassVar[int]
    METHOD_ARGUMENTS_FIELD_NUMBER: _ClassVar[int]
    PAYMENT_FIELD_NUMBER: _ClassVar[int]
    contract: _common_pb2.Entity
    contract_id: str
    method_name: str
    arguments: _containers.MessageMap[str, _common_pb2.Value]
    method_arguments: _containers.MessageMap[str, _common_pb2.Value]
    payment: _common_pb2.CurrencyValue
    def __init__(self, contract: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., contract_id: _Optional[str] = ..., method_name: _Optional[str] = ..., arguments: _Optional[_Mapping[str, _common_pb2.Value]] = ..., method_arguments: _Optional[_Mapping[str, _common_pb2.Value]] = ..., payment: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...

class CreateContractTokenManager(_message.Message):
    __slots__ = ("public_key", "account_comment", "key_format")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    account_comment: str
    key_format: KeyFormat
    def __init__(self, public_key: _Optional[bytes] = ..., account_comment: _Optional[str] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ...) -> None: ...

class TransferContractTokenManager(_message.Message):
    __slots__ = ("public_key", "account_comment", "key_format")
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_COMMENT_FIELD_NUMBER: _ClassVar[int]
    KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    public_key: bytes
    account_comment: str
    key_format: KeyFormat
    def __init__(self, public_key: _Optional[bytes] = ..., account_comment: _Optional[str] = ..., key_format: _Optional[_Union[KeyFormat, str]] = ...) -> None: ...

class RemoveSigningPublicKey(_message.Message):
    __slots__ = ("key_slot",)
    KEY_SLOT_FIELD_NUMBER: _ClassVar[int]
    key_slot: _common_pb2.KeySlot
    def __init__(self, key_slot: _Optional[_Union[_common_pb2.KeySlot, str]] = ...) -> None: ...

class ReplaceSigningPublicKey(_message.Message):
    __slots__ = ("key_slot", "new_public_key", "new_key_format")
    KEY_SLOT_FIELD_NUMBER: _ClassVar[int]
    NEW_PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    NEW_KEY_FORMAT_FIELD_NUMBER: _ClassVar[int]
    key_slot: _common_pb2.KeySlot
    new_public_key: bytes
    new_key_format: KeyFormat
    def __init__(self, key_slot: _Optional[_Union[_common_pb2.KeySlot, str]] = ..., new_public_key: _Optional[bytes] = ..., new_key_format: _Optional[_Union[KeyFormat, str]] = ...) -> None: ...
