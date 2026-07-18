#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(mktemp -d)"

cleanup() {
  [[ -n "${TEST_DIR:-}" && -d "$TEST_DIR" ]] && rm -rf -- "$TEST_DIR"
}
trap cleanup EXIT

mkdir -p "$TEST_DIR/bin" "$TEST_DIR/root" "$TEST_DIR/fake-tools" "$TEST_DIR/fake-home"
printf '#!/usr/bin/env sh\nexit 0\n' >"$TEST_DIR/bin/haco-server"
printf '#!/usr/bin/env sh\nexit 0\n' >"$TEST_DIR/bin/openclaw"
cat >"$TEST_DIR/fake-tools/getent" <<EOF
#!/usr/bin/env sh
if [ "\$1" = "passwd" ] && [ "\$2" = "$(id -un)" ]; then
  printf '%s:x:%s:%s::%s:/bin/bash\n' "$(id -un)" "$(id -u)" "$(id -g)" "$TEST_DIR/fake-home"
  exit 0
fi
exit 2
EOF
chmod 0755 "$TEST_DIR/bin/haco-server" "$TEST_DIR/bin/openclaw" "$TEST_DIR/fake-tools/getent"

PATH="$TEST_DIR/fake-tools:$PATH" \
HACO_INSTALL_SYSTEM=Linux \
HACO_INSTALL_ROOT="$TEST_DIR/root" \
HACO_INSTALL_BINARY="$TEST_DIR/bin/haco-server" \
HACO_SKIP_SYSTEMD=1 \
bash "$PROJECT_DIR/scripts/install-linux.sh" \
  --yes \
  --reconfigure \
  --public \
  --user "$(id -un)" \
  --openclaw-bin "$TEST_DIR/bin/openclaw"

test -x "$TEST_DIR/root/usr/local/bin/haco-server"
test -f "$TEST_DIR/root/etc/haco/haco.env"
test -f "$TEST_DIR/root/etc/systemd/system/haco.service"
grep -Fq 'HACO_BIND="0.0.0.0:8787"' "$TEST_DIR/root/etc/haco/haco.env"
grep -Fq "HACO_OPENCLAW_BIN=\"$TEST_DIR/bin/openclaw\"" "$TEST_DIR/root/etc/haco/haco.env"
grep -Fq "User=$(id -un)" "$TEST_DIR/root/etc/systemd/system/haco.service"

printf '\nHACO_INSTALL_TEST_SENTINEL="preserved"\n' >>"$TEST_DIR/root/etc/haco/haco.env"
PATH="$TEST_DIR/fake-tools:$PATH" \
HACO_INSTALL_SYSTEM=Linux \
HACO_INSTALL_ROOT="$TEST_DIR/root" \
HACO_INSTALL_BINARY="$TEST_DIR/bin/haco-server" \
HACO_SKIP_SYSTEMD=1 \
bash "$PROJECT_DIR/scripts/install-linux.sh" \
  --yes \
  --local \
  --user "$(id -un)" \
  --openclaw-bin "$TEST_DIR/bin/openclaw"
grep -Fq 'HACO_INSTALL_TEST_SENTINEL="preserved"' "$TEST_DIR/root/etc/haco/haco.env"
grep -Fq 'HACO_BIND="0.0.0.0:8787"' "$TEST_DIR/root/etc/haco/haco.env"

PATH="$TEST_DIR/fake-tools:$PATH" \
HACO_INSTALL_SYSTEM=Linux \
HACO_INSTALL_ROOT="$TEST_DIR/root" \
HACO_INSTALL_BINARY="$TEST_DIR/bin/haco-server" \
HACO_SKIP_SYSTEMD=1 \
bash "$PROJECT_DIR/scripts/install-linux.sh" \
  --yes \
  --reconfigure \
  --bind 127.0.0.1:9887 \
  --user "$(id -un)" \
  --openclaw-bin "$TEST_DIR/bin/openclaw"
grep -Fq 'HACO_BIND="127.0.0.1:9887"' "$TEST_DIR/root/etc/haco/haco.env"
find "$TEST_DIR/root/etc/haco" -maxdepth 1 -type f -name 'haco.env.backup.*' | grep -q .

echo "Linux installer integration test passed"
