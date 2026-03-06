#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_VERSION="24.14.0"
TOOLS_DIR="$ROOT_DIR/.local-tools"

platform="$(uname -s)"
arch="$(uname -m)"

case "$platform-$arch" in
  Darwin-arm64)
    node_target="darwin-arm64"
    ;;
  Darwin-x86_64)
    node_target="darwin-x64"
    ;;
  Linux-aarch64|Linux-arm64)
    node_target="linux-arm64"
    ;;
  Linux-x86_64)
    node_target="linux-x64"
    ;;
  *)
    echo "Unsupported platform: $platform-$arch" >&2
    exit 1
    ;;
esac

node_dir="$TOOLS_DIR/node-v$NODE_VERSION-$node_target"
archive_path="$TOOLS_DIR/node-v$NODE_VERSION-$node_target.tar.xz"
node_bin="$node_dir/bin/node"
corepack_bin="$node_dir/bin/corepack"

if [ ! -x "$node_bin" ]; then
  mkdir -p "$TOOLS_DIR"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-$node_target.tar.xz" -o "$archive_path"
  tar -xJf "$archive_path" -C "$TOOLS_DIR"
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 1
fi

export PATH="$node_dir/bin:$PATH"

case "$1" in
  pnpm)
    shift
    exec "$corepack_bin" pnpm "$@"
    ;;
  node)
    shift
    exec "$node_bin" "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
