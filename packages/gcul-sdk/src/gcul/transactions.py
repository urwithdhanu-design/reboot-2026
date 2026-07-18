"""High-level builders for common GCUL client transactions."""

from __future__ import annotations

from google.cloud.universalledger.v1 import (
    accounts_pb2,
    common_pb2,
    transactions_pb2,
    types_pb2,
)

from gcul.keys import KeyPair
from gcul.signing import Signer, sign_client_transaction


class TransactionBuilder:
    """Build and optionally sign common Universal Ledger transactions."""

    def __init__(self, sender_id: str, sequence_number: int):
        self.sender_id = sender_id
        self.sequence_number = sequence_number

    def _base(self, **kwargs) -> types_pb2.ClientTransaction:
        return types_pb2.ClientTransaction(
            sender_id=self.sender_id,
            sequence_number=self.sequence_number,
            chained_unit=False,
            **kwargs,
        )

    def transfer(
        self,
        *,
        beneficiary_id: str,
        amount_minor_units: int,
    ) -> types_pb2.ClientTransaction:
        return self._base(
            transfer_transaction=transactions_pb2.Transfer(
                beneficiary_id=beneficiary_id,
                amount=common_pb2.CurrencyValue(value=amount_minor_units),
            )
        )

    def mint(
        self,
        *,
        beneficiary_id: str,
        amount_minor_units: int,
    ) -> types_pb2.ClientTransaction:
        return self._base(
            mint_transaction=transactions_pb2.Mint(
                beneficiary_id=beneficiary_id,
                mint_amount=common_pb2.CurrencyValue(value=amount_minor_units),
            )
        )

    def burn(
        self,
        *,
        payer_id: str,
        amount_minor_units: int,
    ) -> types_pb2.ClientTransaction:
        return self._base(
            burn_transaction=transactions_pb2.Burn(
                payer_id=payer_id,
                burn_amount=common_pb2.CurrencyValue(value=amount_minor_units),
            )
        )

    def create_account(
        self,
        *,
        public_key: bytes | KeyPair,
        roles: list[accounts_pb2.Role] | None = None,
        token_manager_id: str | None = None,
        account_comment: str | None = None,
        account_status: accounts_pb2.AccountStatus | None = None,
        key_format: transactions_pb2.KeyFormat = (
            transactions_pb2.KEY_FORMAT_PEM_EC_P256_SHA256
        ),
    ) -> types_pb2.ClientTransaction:
        if isinstance(public_key, KeyPair):
            public_key = public_key.public_key_pem_bytes()

        create = transactions_pb2.CreateAccount(
            public_key=public_key,
            key_format=key_format,
        )
        if roles:
            create.roles.extend(roles)
        if token_manager_id:
            create.token_manager_id = token_manager_id
        if account_comment:
            create.account_comment = account_comment
        if account_status is not None:
            create.account_status = account_status

        return self._base(create_account_transaction=create)

    def create_contract(
        self,
        *,
        contract_bytes: bytes,
        init_arguments: dict[str, common_pb2.Value] | None = None,
        contract_comment: str | None = None,
    ) -> types_pb2.ClientTransaction:
        create = transactions_pb2.CreateContract(contract_bytes=contract_bytes)
        if init_arguments:
            for key, value in init_arguments.items():
                create.init_arguments[key].CopyFrom(value)
        if contract_comment:
            create.contract_comment = contract_comment
        return self._base(create_contract_transaction=create)

    def invoke_contract_method(
        self,
        *,
        contract_id: str,
        method_name: str,
        method_arguments: dict[str, common_pb2.Value] | None = None,
        payment_minor_units: int = 0,
    ) -> types_pb2.ClientTransaction:
        invoke = transactions_pb2.InvokeContractMethod(
            contract_id=contract_id,
            method_name=method_name,
            payment=common_pb2.CurrencyValue(value=payment_minor_units),
        )
        if method_arguments:
            for key, value in method_arguments.items():
                invoke.method_arguments[key].CopyFrom(value)
        return self._base(invoke_contract_method_transaction=invoke)

    def sign(
        self,
        client_tx: types_pb2.ClientTransaction,
        signer: Signer,
        *,
        other_signers: list[Signer] | None = None,
    ) -> tuple[types_pb2.SignedTransaction, bytes, str]:
        """Sign ``client_tx`` and return signed message, bytes, and digest hex."""
        return sign_client_transaction(
            client_tx, signer, other_signers=other_signers
        )
