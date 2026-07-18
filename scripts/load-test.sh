#!/usr/bin/env sh
set -eu

MESSAGES="${HACO_LOAD_MESSAGES:-2000}"
SEARCHES="${HACO_LOAD_SEARCHES:-200}"
CONCURRENCY="${HACO_LOAD_CONCURRENCY:-20}"
MEMORY_LIMIT_MB="${HACO_MEMORY_LIMIT_MB:-500}"
PORT="${HACO_LOAD_PORT:-18787}"
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
BINARY="$ROOT/target/release/haco-server"
TEMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/haco-load.XXXXXX")
COOKIE="$TEMP_DIR/cookies.txt"
SAMPLES="$TEMP_DIR/rss-kib.txt"
BASE="http://127.0.0.1:$PORT"
SERVER_PID=""
SAMPLER_PID=""

cleanup() {
  [ -z "$SAMPLER_PID" ] || kill "$SAMPLER_PID" 2>/dev/null || true
  [ -z "$SERVER_PID" ] || kill "$SERVER_PID" 2>/dev/null || true
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

if [ "${HACO_LOAD_SKIP_BUILD:-0}" != "1" ]; then
  (cd "$ROOT" && cargo build --release --bin haco-server)
fi

HACO_DATABASE="$TEMP_DIR/load.db" HACO_UPLOAD_DIR="$TEMP_DIR/uploads" HACO_BIND="127.0.0.1:$PORT" "$BINARY" >"$TEMP_DIR/server.log" 2>&1 &
SERVER_PID=$!

attempt=0
until curl -fsS "$BASE/health" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 100 ]; then
    echo "Server did not become healthy" >&2
    sed -n '1,120p' "$TEMP_DIR/server.log" >&2
    exit 1
  fi
  sleep 0.1
done

curl -fsS -c "$COOKIE" -H 'content-type: application/json' -d '{"display_name":"Load Admin","username":"loadadmin","email":"load@example.com","password":"LoadValidation-2026!"}' "$BASE/api/auth/setup" >/dev/null

idle_kib=$(ps -o rss= -p "$SERVER_PID" | tr -d ' ')
(
  while kill -0 "$SERVER_PID" 2>/dev/null; do
    ps -o rss= -p "$SERVER_PID" | tr -d ' ' >>"$SAMPLES" || true
    sleep 0.1
  done
) &
SAMPLER_PID=$!

started=$(date +%s)
export BASE COOKIE
seq 1 "$MESSAGES" | xargs -P "$CONCURRENCY" -n 1 sh -c '
  i="$1"
  curl -fsS -b "$COOKIE" -H "content-type: application/json" \
    -d "{\"sender_id\":\"ignored\",\"body\":\"RAM validation message $i\",\"parent_message_id\":null,\"attachments\":[]}" \
    "$BASE/api/conversations/channel-general/messages" >/dev/null
' sh
seq 1 "$SEARCHES" | xargs -P "$CONCURRENCY" -n 1 sh -c '
  curl -fsS -b "$COOKIE" "$BASE/api/search?q=validation&conversation_id=channel-general" >/dev/null
' sh
curl -fsS -b "$COOKIE" "$BASE/api/conversations/channel-general/messages?limit=50" >/dev/null
finished=$(date +%s)

sleep 1
peak_kib=$(awk 'BEGIN { max=0 } /^[0-9]+$/ { if ($1 > max) max=$1 } END { print max }' "$SAMPLES")
limit_kib=$((MEMORY_LIMIT_MB * 1024))
database_bytes=$(wc -c <"$TEMP_DIR/load.db" | tr -d ' ')
elapsed=$((finished - started))

echo "Haco formal RAM/load validation"
echo "  workload: $MESSAGES writes + $SEARCHES searches"
echo "  concurrency: $CONCURRENCY"
echo "  elapsed_seconds: $elapsed"
echo "  idle_rss_mib: $(awk -v value="$idle_kib" 'BEGIN { printf "%.1f", value / 1024 }')"
echo "  peak_rss_mib: $(awk -v value="$peak_kib" 'BEGIN { printf "%.1f", value / 1024 }')"
echo "  database_mib: $(awk -v value="$database_bytes" 'BEGIN { printf "%.1f", value / 1048576 }')"
echo "  limit_mib: $MEMORY_LIMIT_MB"

if [ "$peak_kib" -gt "$limit_kib" ]; then
  echo "  result: FAIL" >&2
  exit 1
fi
echo "  result: PASS"
