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

# Exercise the release-download path with a local archive. The binary must be
# extracted into a separate directory before it is staged, otherwise install
# rejects a source and destination that are the same file.
mkdir -p "$TEST_DIR/release"
cp "$TEST_DIR/bin/haco-server" "$TEST_DIR/release/haco-server"
tar -C "$TEST_DIR/release" -czf "$TEST_DIR/release/haco-linux-x86_64.tar.gz" haco-server
if command -v sha256sum >/dev/null 2>&1; then
  (
    cd "$TEST_DIR/release"
    sha256sum haco-linux-x86_64.tar.gz > haco-linux-x86_64.tar.gz.sha256
  )
else
  (
    cd "$TEST_DIR/release"
    shasum -a 256 haco-linux-x86_64.tar.gz > haco-linux-x86_64.tar.gz.sha256
  )
  cat >"$TEST_DIR/fake-tools/sha256sum" <<'EOF'
#!/usr/bin/env sh
if [ "$1" = "--check" ]; then
  shasum -a 256 -c "$2"
else
  shasum -a 256 "$@"
fi
EOF
  chmod 0755 "$TEST_DIR/fake-tools/sha256sum"
fi
cat >"$TEST_DIR/fake-tools/curl" <<'EOF'
#!/usr/bin/env sh
output=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "--output" ]; then
    output="$2"
    shift 2
  else
    shift
  fi
done
case "$output" in
  *haco-linux-x86_64.tar.gz) cp "$HACO_TEST_RELEASE_DIR/haco-linux-x86_64.tar.gz" "$output" ;;
  *haco-linux-x86_64.tar.gz.sha256) cp "$HACO_TEST_RELEASE_DIR/haco-linux-x86_64.tar.gz.sha256" "$output" ;;
  *) exit 2 ;;
esac
EOF
chmod 0755 "$TEST_DIR/fake-tools/curl"
PATH="$TEST_DIR/fake-tools:$PATH" \
HACO_INSTALL_SYSTEM=Linux \
HACO_INSTALL_MACHINE=x86_64 \
HACO_TEST_RELEASE_DIR="$TEST_DIR/release" \
HACO_INSTALL_ROOT="$TEST_DIR/download-root" \
HACO_SKIP_SYSTEMD=1 \
bash "$PROJECT_DIR/scripts/install-linux.sh" \
  --yes \
  --public \
  --user "$(id -un)" \
  --openclaw-bin "$TEST_DIR/bin/openclaw"
test -x "$TEST_DIR/download-root/usr/local/bin/haco-server"

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
