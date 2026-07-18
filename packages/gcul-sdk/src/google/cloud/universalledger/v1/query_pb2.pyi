from google.api import field_behavior_pb2 as _field_behavior_pb2
from google.cloud.universalledger.v1 import accounts_pb2 as _accounts_pb2
from google.cloud.universalledger.v1 import common_pb2 as _common_pb2
from google.cloud.universalledger.v1 import transactions_pb2 as _transactions_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Account(_message.Message):
    __slots__ = ("user_details", "account_manager_details", "token_manager_details", "contract_token_manager_details", "contract_details", "clearinghouse_details", "currency_operator_details", "platform_operator_details", "sequence_number", "public_key", "round_id", "comment")
    USER_DETAILS_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_MANAGER_DETAILS_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_DETAILS_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_TOKEN_MANAGER_DETAILS_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_DETAILS_FIELD_NUMBER: _ClassVar[int]
    CLEARINGHOUSE_DETAILS_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_OPERATOR_DETAILS_FIELD_NUMBER: _ClassVar[int]
    PLATFORM_OPERATOR_DETAILS_FIELD_NUMBER: _ClassVar[int]
    SEQUENCE_NUMBER_FIELD_NUMBER: _ClassVar[int]
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    ROUND_ID_FIELD_NUMBER: _ClassVar[int]
    COMMENT_FIELD_NUMBER: _ClassVar[int]
    user_details: UserDetails
    account_manager_details: AccountManagerDetails
    token_manager_details: TokenManagerDetails
    contract_token_manager_details: ContractTokenManagerDetails
    contract_details: ContractDetails
    clearinghouse_details: ClearingHouseDetails
    currency_operator_details: CurrencyOperatorDetails
    platform_operator_details: PlatformOperatorDetails
    sequence_number: int
    public_key: bytes
    round_id: int
    comment: str
    def __init__(self, user_details: _Optional[_Union[UserDetails, _Mapping]] = ..., account_manager_details: _Optional[_Union[AccountManagerDetails, _Mapping]] = ..., token_manager_details: _Optional[_Union[TokenManagerDetails, _Mapping]] = ..., contract_token_manager_details: _Optional[_Union[ContractTokenManagerDetails, _Mapping]] = ..., contract_details: _Optional[_Union[ContractDetails, _Mapping]] = ..., clearinghouse_details: _Optional[_Union[ClearingHouseDetails, _Mapping]] = ..., currency_operator_details: _Optional[_Union[CurrencyOperatorDetails, _Mapping]] = ..., platform_operator_details: _Optional[_Union[PlatformOperatorDetails, _Mapping]] = ..., sequence_number: _Optional[int] = ..., public_key: _Optional[bytes] = ..., round_id: _Optional[int] = ..., comment: _Optional[str] = ...) -> None: ...

class AccountManagerDetails(_message.Message):
    __slots__ = ("token_manager", "num_accounts", "token_manager_id")
    TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    NUM_ACCOUNTS_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    token_manager: _common_pb2.Entity
    num_accounts: int
    token_manager_id: str
    def __init__(self, token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., num_accounts: _Optional[int] = ..., token_manager_id: _Optional[str] = ...) -> None: ...

class TokenManagerDetails(_message.Message):
    __slots__ = ("issuance_limit", "issued_tokens")
    ISSUANCE_LIMIT_FIELD_NUMBER: _ClassVar[int]
    ISSUED_TOKENS_FIELD_NUMBER: _ClassVar[int]
    issuance_limit: _common_pb2.CurrencyValue
    issued_tokens: _common_pb2.CurrencyValue
    def __init__(self, issuance_limit: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., issued_tokens: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...

class ContractTokenManagerDetails(_message.Message):
    __slots__ = ("issuance_limit", "issued_tokens", "previous_contract_token_manager_id", "account_status")
    ISSUANCE_LIMIT_FIELD_NUMBER: _ClassVar[int]
    ISSUED_TOKENS_FIELD_NUMBER: _ClassVar[int]
    PREVIOUS_CONTRACT_TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_STATUS_FIELD_NUMBER: _ClassVar[int]
    issuance_limit: _common_pb2.CurrencyValue
    issued_tokens: _common_pb2.CurrencyValue
    previous_contract_token_manager_id: str
    account_status: _accounts_pb2.AccountStatus
    def __init__(self, issuance_limit: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., issued_tokens: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., previous_contract_token_manager_id: _Optional[str] = ..., account_status: _Optional[_Union[_accounts_pb2.AccountStatus, str]] = ...) -> None: ...

class UserDetails(_message.Message):
    __slots__ = ("account_manager", "account_manager_id", "token_manager", "token_manager_id", "roles", "account_status", "balance", "account_fields", "contract_account_fields")
    class AccountFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: Fields
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Fields, _Mapping]] = ...) -> None: ...
    class ContractAccountFieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: Fields
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Fields, _Mapping]] = ...) -> None: ...
    ACCOUNT_MANAGER_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    ROLES_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_STATUS_FIELD_NUMBER: _ClassVar[int]
    BALANCE_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_ACCOUNT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    account_manager: _common_pb2.Entity
    account_manager_id: str
    token_manager: _common_pb2.Entity
    token_manager_id: str
    roles: _containers.RepeatedScalarFieldContainer[_accounts_pb2.Role]
    account_status: _accounts_pb2.AccountStatus
    balance: _common_pb2.CurrencyValue
    account_fields: _containers.MessageMap[str, Fields]
    contract_account_fields: _containers.MessageMap[str, Fields]
    def __init__(self, account_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., account_manager_id: _Optional[str] = ..., token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., token_manager_id: _Optional[str] = ..., roles: _Optional[_Iterable[_Union[_accounts_pb2.Role, str]]] = ..., account_status: _Optional[_Union[_accounts_pb2.AccountStatus, str]] = ..., balance: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ..., account_fields: _Optional[_Mapping[str, Fields]] = ..., contract_account_fields: _Optional[_Mapping[str, Fields]] = ...) -> None: ...

class CurrencyOperatorDetails(_message.Message):
    __slots__ = ("currency", "currency_code", "account_status", "previous_entity_id", "previous_currency_operator_id", "platform_operator_entity_id", "platform_operator_id", "contract_token_manager", "contract_token_manager_id", "clearinghouse_id")
    CURRENCY_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_CODE_FIELD_NUMBER: _ClassVar[int]
    ACCOUNT_STATUS_FIELD_NUMBER: _ClassVar[int]
    PREVIOUS_ENTITY_ID_FIELD_NUMBER: _ClassVar[int]
    PREVIOUS_CURRENCY_OPERATOR_ID_FIELD_NUMBER: _ClassVar[int]
    PLATFORM_OPERATOR_ENTITY_ID_FIELD_NUMBER: _ClassVar[int]
    PLATFORM_OPERATOR_ID_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_TOKEN_MANAGER_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_TOKEN_MANAGER_ID_FIELD_NUMBER: _ClassVar[int]
    CLEARINGHOUSE_ID_FIELD_NUMBER: _ClassVar[int]
    currency: str
    currency_code: str
    account_status: _accounts_pb2.AccountStatus
    previous_entity_id: _common_pb2.Entity
    previous_currency_operator_id: str
    platform_operator_entity_id: _common_pb2.Entity
    platform_operator_id: str
    contract_token_manager: _common_pb2.Entity
    contract_token_manager_id: str
    clearinghouse_id: str
    def __init__(self, currency: _Optional[str] = ..., currency_code: _Optional[str] = ..., account_status: _Optional[_Union[_accounts_pb2.AccountStatus, str]] = ..., previous_entity_id: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., previous_currency_operator_id: _Optional[str] = ..., platform_operator_entity_id: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., platform_operator_id: _Optional[str] = ..., contract_token_manager: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., contract_token_manager_id: _Optional[str] = ..., clearinghouse_id: _Optional[str] = ...) -> None: ...

class PlatformOperatorDetails(_message.Message):
    __slots__ = ("account_status", "previous_entity_id", "previous_platform_operator_id")
    ACCOUNT_STATUS_FIELD_NUMBER: _ClassVar[int]
    PREVIOUS_ENTITY_ID_FIELD_NUMBER: _ClassVar[int]
    PREVIOUS_PLATFORM_OPERATOR_ID_FIELD_NUMBER: _ClassVar[int]
    account_status: _accounts_pb2.AccountStatus
    previous_entity_id: _common_pb2.Entity
    previous_platform_operator_id: str
    def __init__(self, account_status: _Optional[_Union[_accounts_pb2.AccountStatus, str]] = ..., previous_entity_id: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., previous_platform_operator_id: _Optional[str] = ...) -> None: ...

class ClearingHouseDetails(_message.Message):
    __slots__ = ("account_status", "balances", "settlement_mode")
    ACCOUNT_STATUS_FIELD_NUMBER: _ClassVar[int]
    BALANCES_FIELD_NUMBER: _ClassVar[int]
    SETTLEMENT_MODE_FIELD_NUMBER: _ClassVar[int]
    account_status: _accounts_pb2.AccountStatus
    balances: _containers.RepeatedCompositeFieldContainer[BalanceToSettle]
    settlement_mode: _transactions_pb2.SettlementMode
    def __init__(self, account_status: _Optional[_Union[_accounts_pb2.AccountStatus, str]] = ..., balances: _Optional[_Iterable[_Union[BalanceToSettle, _Mapping]]] = ..., settlement_mode: _Optional[_Union[_transactions_pb2.SettlementMode, str]] = ...) -> None: ...

class ContractDetails(_message.Message):
    __slots__ = ("owner", "owner_id", "code", "contract_fields", "currency_balances")
    class CurrencyBalancesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _common_pb2.CurrencyValue
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...
    OWNER_FIELD_NUMBER: _ClassVar[int]
    OWNER_ID_FIELD_NUMBER: _ClassVar[int]
    CODE_FIELD_NUMBER: _ClassVar[int]
    CONTRACT_FIELDS_FIELD_NUMBER: _ClassVar[int]
    CURRENCY_BALANCES_FIELD_NUMBER: _ClassVar[int]
    owner: _common_pb2.Entity
    owner_id: str
    code: bytes
    contract_fields: Fields
    currency_balances: _containers.MessageMap[str, _common_pb2.CurrencyValue]
    def __init__(self, owner: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., owner_id: _Optional[str] = ..., code: _Optional[bytes] = ..., contract_fields: _Optional[_Union[Fields, _Mapping]] = ..., currency_balances: _Optional[_Mapping[str, _common_pb2.CurrencyValue]] = ...) -> None: ...

class BalanceToSettle(_message.Message):
    __slots__ = ("balance_payer", "balance_payer_id", "balance_receiver", "balance_receiver_id", "balance")
    BALANCE_PAYER_FIELD_NUMBER: _ClassVar[int]
    BALANCE_PAYER_ID_FIELD_NUMBER: _ClassVar[int]
    BALANCE_RECEIVER_FIELD_NUMBER: _ClassVar[int]
    BALANCE_RECEIVER_ID_FIELD_NUMBER: _ClassVar[int]
    BALANCE_FIELD_NUMBER: _ClassVar[int]
    balance_payer: _common_pb2.Entity
    balance_payer_id: str
    balance_receiver: _common_pb2.Entity
    balance_receiver_id: str
    balance: _common_pb2.CurrencyValue
    def __init__(self, balance_payer: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., balance_payer_id: _Optional[str] = ..., balance_receiver: _Optional[_Union[_common_pb2.Entity, _Mapping]] = ..., balance_receiver_id: _Optional[str] = ..., balance: _Optional[_Union[_common_pb2.CurrencyValue, _Mapping]] = ...) -> None: ...

class Fields(_message.Message):
    __slots__ = ("fields",)
    class FieldsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _common_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_common_pb2.Value, _Mapping]] = ...) -> None: ...
    FIELDS_FIELD_NUMBER: _ClassVar[int]
    fields: _containers.MessageMap[str, _common_pb2.Value]
    def __init__(self, fields: _Optional[_Mapping[str, _common_pb2.Value]] = ...) -> None: ...
