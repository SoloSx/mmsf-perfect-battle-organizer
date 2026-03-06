#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/with-local-node.sh pnpm install --frozen-lockfile
./scripts/with-local-node.sh pnpm lint
./scripts/with-local-node.sh pnpm build
