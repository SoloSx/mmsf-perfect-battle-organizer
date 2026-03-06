#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/with-local-node.sh pnpm build
exec ./scripts/with-local-node.sh pnpm exec serve out -l 3100
