from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from typing import ClassVar as _ClassVar

DESCRIPTOR: _descriptor.FileDescriptor

class AccountStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    ACCOUNT_STATUS_UNSPECIFIED: _ClassVar[AccountStatus]
    ACCOUNT_STATUS_ACTIVE: _ClassVar[AccountStatus]
    ACCOUNT_STATUS_INACTIVE: _ClassVar[AccountStatus]

class Role(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    ROLE_UNSPECIFIED: _ClassVar[Role]
    ROLE_PAYER: _ClassVar[Role]
    ROLE_RECEIVER: _ClassVar[Role]
    ROLE_CONTRACT_CREATOR: _ClassVar[Role]
    ROLE_CONTRACT_PARTICIPANT: _ClassVar[Role]

class ContractPermission(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    CONTRACT_PERMISSION_UNSPECIFIED: _ClassVar[ContractPermission]
    CONTRACT_PERMISSION_STORAGE: _ClassVar[ContractPermission]
ACCOUNT_STATUS_UNSPECIFIED: AccountStatus
ACCOUNT_STATUS_ACTIVE: AccountStatus
ACCOUNT_STATUS_INACTIVE: AccountStatus
ROLE_UNSPECIFIED: Role
ROLE_PAYER: Role
ROLE_RECEIVER: Role
ROLE_CONTRACT_CREATOR: Role
ROLE_CONTRACT_PARTICIPANT: Role
CONTRACT_PERMISSION_UNSPECIFIED: ContractPermission
CONTRACT_PERMISSION_STORAGE: ContractPermission
