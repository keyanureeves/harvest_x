#!/usr/bin/env bash
# Generates throwaway Sepolia wallets for demo testers.
#
# Produces two files, both gitignored:
#   demo-testers.keys.csv   address,privateKey  -> consumed by OnboardTesters.s.sol
#   demo-testers.csv        address,label       -> no secrets, safe to share
#
# These are independent keypairs with no shared recovery seed, so
# demo-testers.keys.csv is the ONLY way to recover them. Back it up offline.
#
# WARNING: the addresses produced here get published in README.md together with
# their keys, so anyone can act as these farmers. They must stay Sepolia-only and
# must never hold anything of value. Rotate them by re-running both make targets.
set -euo pipefail

COUNT="${1:-5}"
LABEL="${2:-tester}"
KEYS_FILE="demo-testers.keys.csv"
ADDR_FILE="demo-testers.csv"

if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -lt 1 ]; then
  echo "usage: $0 <count> [label-prefix]" >&2
  exit 1
fi

if ! command -v cast >/dev/null 2>&1; then
  echo "error: cast (foundry) is required" >&2
  exit 1
fi

if [ -s "$KEYS_FILE" ]; then
  echo "refusing to overwrite existing $KEYS_FILE" >&2
  echo "  it holds live keypairs; delete it first if you really mean to regenerate" >&2
  exit 1
fi

umask 077
: >"$KEYS_FILE"
: >"$ADDR_FILE"

for i in $(seq 0 $((COUNT - 1))); do
  # cast prints "0xADDR<TAB>0xKEY" on stdout (0x on the key is not always
  # present, so normalise both halves before using them).
  line="$(cast wallet new 2>/dev/null | tail -n 1)"
  addr="${line%%$'\t'*}"
  addr="0x${addr#0x}"
  pk="${line##*$'\t'}"
  pk="0x${pk#0x}"

  if [ "$(cast wallet address --private-key "$pk")" != "$addr" ]; then
    echo "error: failed to parse keypair on iteration $i" >&2
    rm -f "$KEYS_FILE"
    exit 1
  fi

  echo "$addr,$pk" >>"$KEYS_FILE"
  echo "$addr,${LABEL}-$((i + 1))" >>"$ADDR_FILE"
done

chmod 600 "$KEYS_FILE"
chmod 644 "$ADDR_FILE"

cat <<EOF

Generated $COUNT wallet(s).

  $KEYS_FILE   private keys - gitignored, chmod 600, DO NOT COMMIT
  $ADDR_FILE    addresses + labels only, safe to share

Hand out: <address> + the matching private key, per tester, out of band.

Next:
  make onboard-testers-sepolia
EOF