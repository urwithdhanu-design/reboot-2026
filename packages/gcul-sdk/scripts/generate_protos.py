#!/usr/bin/env python3
"""Regenerate Python stubs from vendored Universal Ledger protos."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROTOS = ROOT / "protos"
OUT = ROOT / "src"


def main() -> int:
    import grpc_tools
    from pathlib import Path as P

    grpc_proto = P(grpc_tools.__file__).parent / "_proto"
    files = [
        "google/cloud/universalledger/v1/common.proto",
        "google/cloud/universalledger/v1/accounts.proto",
        "google/cloud/universalledger/v1/transactions.proto",
        "google/cloud/universalledger/v1/status_event.proto",
        "google/cloud/universalledger/v1/types.proto",
        "google/cloud/universalledger/v1/query.proto",
        "google/cloud/universalledger/v1/universalledger.proto",
        "google/api/annotations.proto",
        "google/api/http.proto",
        "google/api/client.proto",
        "google/api/field_behavior.proto",
        "google/api/resource.proto",
        "google/api/launch_stage.proto",
        "google/api/routing.proto",
    ]
    cmd = [
        sys.executable,
        "-m",
        "grpc_tools.protoc",
        f"-I{PROTOS}",
        f"-I{grpc_proto}",
        f"--python_out={OUT}",
        f"--grpc_python_out={OUT}",
        f"--pyi_out={OUT}",
        *files,
    ]
    print(" ".join(cmd))
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
