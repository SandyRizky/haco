#!/usr/bin/env bash
set -Eeuo pipefail

HACO_REPOSITORY="${HACO_REPOSITORY:-SandyRizky/haco}"
HACO_VERSION="${HACO_VERSION:-latest}"
HACO_INSTALL_ROOT="${HACO_INSTALL_ROOT:-}"
HACO_INSTALL_BINARY="${HACO_INSTALL_BINARY:-}"
HACO_SKIP_SYSTEMD="${HACO_SKIP_SYSTEMD:-0}"
HACO_INSTALL_SYSTEM="${HACO_INSTALL_SYSTEM:-$(uname -s)}"

SERVICE_USER=""
OPENCLAW_BIN=""
BIND_ADDRESS=""
ASSUME_YES=0
RECONFIGURE=0
ACCESS_MODE=""

BIN_PATH="/usr/local/bin/haco-server"
CONFIG_DIR="/etc/haco"
CONFIG_PATH="/etc/haco/haco.env"
DATA_DIR="/var/lib/haco"
UPLOAD_DIR="/var/lib/haco/uploads"
SERVICE_PATH="/etc/systemd/system/haco.service"

usage() {
  cat <<'EOF'
Haco Linux installer

Usage:
  install-linux.sh [options]

Options:
  --user USER             Run Haco as this existing Linux user
  --openclaw-bin PATH     Absolute path to the OpenClaw executable
  --public                Listen on 0.0.0.0:8787 (plain HTTP)
  --local                 Listen on 127.0.0.1:8787 (recommended with a proxy)
  --bind ADDRESS          Use an explicit IP:port binding
  --version VERSION       Install a release tag such as v0.1.0 (default: latest)
  --repository OWNER/REPO Download releases from this GitHub repository
  --reconfigure           Replace /etc/haco/haco.env with selected values
  --yes                   Accept safe defaults without prompts
  -h, --help              Show this help

Environment overrides used by packaging/tests:
  HACO_INSTALL_BINARY     Install this local binary instead of downloading
  HACO_INSTALL_ROOT       Stage files beneath this directory
  HACO_SKIP_SYSTEMD=1     Do not invoke systemctl
EOF
}

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

need_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

root_path() {
  printf '%s%s' "$HACO_INSTALL_ROOT" "$1"
}

validate_single_line() {
  local label="$1"
  local value="$2"
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || fail "$label must be one line"
}

validate_environment_value() {
  local label="$1"
  local value="$2"
  validate_single_line "$label" "$value"
  [[ "$value" != *'"'* && "$value" != *'\'* ]] || fail "$label contains unsupported quote or backslash characters"
}

ask_yes_no() {
  local prompt="$1"
  local default="$2"
  local answer=""
  if [[ "$ASSUME_YES" == "1" || ! -r /dev/tty ]]; then
    [[ "$default" == "yes" ]]
    return
  fi
  if [[ "$default" == "yes" ]]; then
    printf '%s [Y/n] ' "$prompt" >/dev/tty
  else
    printf '%s [y/N] ' "$prompt" >/dev/tty
  fi
  IFS= read -r answer </dev/tty || true
  answer="${answer,,}"
  if [[ -z "$answer" ]]; then
    [[ "$default" == "yes" ]]
  else
    [[ "$answer" == "y" || "$answer" == "yes" ]]
  fi
}

run_root() {
  if [[ -n "$HACO_INSTALL_ROOT" || "${EUID:-$(id -u)}" == "0" ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

discover_user_home() {
  local account="$1"
  local record
  record="$(getent passwd "$account" 2>/dev/null || true)"
  [[ -n "$record" ]] || fail "Linux user does not exist: $account"
  printf '%s' "$record" | awk -F: '{print $6}'
}

discover_openclaw() {
  local account_home="$1"
  local candidate=""
  local found=""
  local candidates=(
    "/usr/local/bin/openclaw"
    "/usr/bin/openclaw"
    "$account_home/.local/bin/openclaw"
    "$account_home/.npm-global/bin/openclaw"
    "$account_home/.bun/bin/openclaw"
  )

  if [[ "$SERVICE_USER" == "$(id -un)" ]]; then
    candidate="$(command -v openclaw 2>/dev/null || true)"
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      printf '%s' "$candidate"
      return
    fi
  fi
  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate" ]]; then
      printf '%s' "$candidate"
      return
    fi
  done
  if [[ -d "$account_home/.nvm/versions/node" ]]; then
    found="$(find "$account_home/.nvm/versions/node" -maxdepth 3 -type f -name openclaw -perm -u+x 2>/dev/null | sort -V | tail -n 1)"
    if [[ -n "$found" ]]; then
      printf '%s' "$found"
    fi
  fi
}

download_release() {
  local destination="$1"
  local machine
  local release_arch
  local asset
  local checksum
  local base_url

  machine="$(uname -m)"
  case "$machine" in
    x86_64|amd64) release_arch="x86_64" ;;
    aarch64|arm64) release_arch="arm64" ;;
    *) fail "unsupported Linux architecture: $machine" ;;
  esac

  asset="haco-linux-${release_arch}.tar.gz"
  checksum="${asset}.sha256"
  if [[ "$HACO_VERSION" == "latest" ]]; then
    base_url="https://github.com/${HACO_REPOSITORY}/releases/latest/download"
  else
    base_url="https://github.com/${HACO_REPOSITORY}/releases/download/${HACO_VERSION}"
  fi

  need_command curl
  need_command tar
  need_command sha256sum
  say "Downloading Haco ${HACO_VERSION} for Linux ${release_arch}..."
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    "${base_url}/${asset}" --output "${WORK_DIR}/${asset}"
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    "${base_url}/${checksum}" --output "${WORK_DIR}/${checksum}"
  (
    cd "$WORK_DIR"
    sha256sum --check "$checksum"
  )
  tar -xzf "${WORK_DIR}/${asset}" -C "$WORK_DIR"
  [[ -f "${WORK_DIR}/haco-server" ]] || fail "release archive does not contain haco-server"
  install -m 0755 "${WORK_DIR}/haco-server" "$destination"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user)
      [[ $# -ge 2 ]] || fail "--user requires a value"
      SERVICE_USER="$2"
      shift 2
      ;;
    --openclaw-bin)
      [[ $# -ge 2 ]] || fail "--openclaw-bin requires a value"
      OPENCLAW_BIN="$2"
      shift 2
      ;;
    --public)
      ACCESS_MODE="public"
      shift
      ;;
    --local)
      ACCESS_MODE="local"
      shift
      ;;
    --bind)
      [[ $# -ge 2 ]] || fail "--bind requires a value"
      BIND_ADDRESS="$2"
      ACCESS_MODE="custom"
      shift 2
      ;;
    --version)
      [[ $# -ge 2 ]] || fail "--version requires a value"
      HACO_VERSION="$2"
      shift 2
      ;;
    --repository)
      [[ $# -ge 2 ]] || fail "--repository requires a value"
      HACO_REPOSITORY="$2"
      shift 2
      ;;
    --reconfigure)
      RECONFIGURE=1
      shift
      ;;
    --yes)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
done

[[ "$HACO_INSTALL_SYSTEM" == "Linux" ]] || fail "this installer currently supports Linux only"
need_command install
need_command getent
need_command awk
need_command sed
need_command find
need_command sort
need_command tail
need_command mktemp
need_command dirname
need_command date
need_command cp

if [[ -z "$HACO_INSTALL_ROOT" && "${EUID:-$(id -u)}" != "0" ]]; then
  need_command sudo
fi

if [[ -z "$SERVICE_USER" ]]; then
  if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
    SERVICE_USER="$SUDO_USER"
  else
    SERVICE_USER="$(id -un)"
  fi
fi
validate_single_line "service user" "$SERVICE_USER"
[[ "$HACO_REPOSITORY" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || fail "repository must use OWNER/REPO format"
[[ "$HACO_VERSION" == "latest" || "$HACO_VERSION" =~ ^v?[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || fail "release version contains unsupported characters"
SERVICE_HOME="$(discover_user_home "$SERVICE_USER")"
SERVICE_GROUP="$(id -gn "$SERVICE_USER")"

if [[ -z "$OPENCLAW_BIN" ]]; then
  OPENCLAW_BIN="$(discover_openclaw "$SERVICE_HOME")"
fi
if [[ -n "$OPENCLAW_BIN" ]]; then
  [[ "$OPENCLAW_BIN" == /* ]] || fail "OpenClaw path must be absolute"
  run_root test -x "$OPENCLAW_BIN" || fail "OpenClaw is not executable: $OPENCLAW_BIN"
  validate_environment_value "OpenClaw path" "$OPENCLAW_BIN"
  say "Found OpenClaw: $OPENCLAW_BIN"
else
  say "OpenClaw was not found for $SERVICE_USER; Haco will still be installed."
  say "You can add HACO_OPENCLAW_BIN to $CONFIG_PATH later."
fi

if [[ -z "$ACCESS_MODE" ]]; then
  if ask_yes_no "Expose Haco directly on public port 8787 without HTTPS?" "no"; then
    ACCESS_MODE="public"
  else
    ACCESS_MODE="local"
  fi
fi
if [[ -z "$BIND_ADDRESS" ]]; then
  if [[ "$ACCESS_MODE" == "public" ]]; then
    BIND_ADDRESS="0.0.0.0:8787"
  else
    BIND_ADDRESS="127.0.0.1:8787"
  fi
fi
validate_environment_value "bind address" "$BIND_ADDRESS"
[[ "$BIND_ADDRESS" == *:* ]] || fail "bind address must contain an IP and port"
HACO_PORT="${BIND_ADDRESS##*:}"
[[ "$HACO_PORT" =~ ^[0-9]+$ ]] || fail "bind address must end with a numeric port"
(( HACO_PORT >= 1 && HACO_PORT <= 65535 )) || fail "bind port is out of range"

WORK_DIR="$(mktemp -d)"
cleanup() {
  [[ -n "${WORK_DIR:-}" && -d "$WORK_DIR" ]] && rm -rf -- "$WORK_DIR"
}
trap cleanup EXIT

STAGED_BINARY="${WORK_DIR}/haco-server"
if [[ -n "$HACO_INSTALL_BINARY" ]]; then
  [[ -f "$HACO_INSTALL_BINARY" ]] || fail "local Haco binary not found: $HACO_INSTALL_BINARY"
  install -m 0755 "$HACO_INSTALL_BINARY" "$STAGED_BINARY"
else
  download_release "$STAGED_BINARY"
fi

TARGET_BIN="$(root_path "$BIN_PATH")"
TARGET_CONFIG_DIR="$(root_path "$CONFIG_DIR")"
TARGET_CONFIG="$(root_path "$CONFIG_PATH")"
TARGET_DATA="$(root_path "$DATA_DIR")"
TARGET_UPLOADS="$(root_path "$UPLOAD_DIR")"
TARGET_SERVICE="$(root_path "$SERVICE_PATH")"

run_root install -d -m 0755 "$(dirname "$TARGET_BIN")"
run_root install -m 0755 "$STAGED_BINARY" "$TARGET_BIN"
if [[ -n "$HACO_INSTALL_ROOT" ]]; then
  install -d -m 0750 "$TARGET_DATA"
  install -d -m 0750 "$TARGET_UPLOADS"
else
  run_root install -d -m 0750 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$TARGET_DATA"
  run_root install -d -m 0750 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$TARGET_UPLOADS"
fi
run_root install -d -m 0755 "$TARGET_CONFIG_DIR"

OPENCLAW_DIR=""
if [[ -n "$OPENCLAW_BIN" ]]; then
  OPENCLAW_DIR="$(dirname "$OPENCLAW_BIN")"
fi
SYSTEM_PATH="${OPENCLAW_DIR:+${OPENCLAW_DIR}:}/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

if [[ ! -f "$TARGET_CONFIG" || "$RECONFIGURE" == "1" ]]; then
  if [[ -f "$TARGET_CONFIG" ]]; then
    CONFIG_BACKUP="${TARGET_CONFIG}.backup.$(date -u +%Y%m%dT%H%M%SZ)"
    run_root cp -p "$TARGET_CONFIG" "$CONFIG_BACKUP"
    say "Backed up existing configuration to ${CONFIG_BACKUP#${HACO_INSTALL_ROOT}}"
  fi
  {
    printf 'HACO_BIND="%s"\n' "$BIND_ADDRESS"
    printf 'HACO_DATABASE="%s"\n' "$DATA_DIR/haco.db"
    printf 'HACO_UPLOAD_DIR="%s"\n' "$UPLOAD_DIR"
    printf 'HACO_LOCAL_URL="http://127.0.0.1:%s"\n' "$HACO_PORT"
    printf 'HACO_COOKIE_SECURE="false"\n'
    printf 'RUST_LOG="haco_server=info,tower_http=info"\n'
    printf 'PATH="%s"\n' "$SYSTEM_PATH"
    if [[ -n "$OPENCLAW_BIN" ]]; then
      printf 'HACO_OPENCLAW_BIN="%s"\n' "$OPENCLAW_BIN"
    fi
  } >"${WORK_DIR}/haco.env"
  if [[ -n "$HACO_INSTALL_ROOT" ]]; then
    install -m 0640 "${WORK_DIR}/haco.env" "$TARGET_CONFIG"
  else
    run_root install -m 0640 -o root -g "$SERVICE_GROUP" "${WORK_DIR}/haco.env" "$TARGET_CONFIG"
  fi
else
  say "Preserving existing configuration: $CONFIG_PATH"
  EXISTING_BIND="$(sed -n 's/^HACO_BIND="\([^"]*\)"$/\1/p' "$TARGET_CONFIG" | tail -n 1)"
  if [[ -n "$EXISTING_BIND" && "$EXISTING_BIND" == *:* ]]; then
    BIND_ADDRESS="$EXISTING_BIND"
    HACO_PORT="${BIND_ADDRESS##*:}"
    if [[ "$BIND_ADDRESS" == 0.0.0.0:* || "$BIND_ADDRESS" == \[*\]:* ]]; then
      ACCESS_MODE="public"
    else
      ACCESS_MODE="local"
    fi
  fi
fi

cat >"${WORK_DIR}/haco.service" <<EOF
[Unit]
Description=Haco communication server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${DATA_DIR}
EnvironmentFile=${CONFIG_PATH}
ExecStart=${BIN_PATH}
Restart=on-failure
RestartSec=3
UMask=0027
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
run_root install -d -m 0755 "$(dirname "$TARGET_SERVICE")"
run_root install -m 0644 "${WORK_DIR}/haco.service" "$TARGET_SERVICE"

if [[ -z "$HACO_INSTALL_ROOT" && "$HACO_SKIP_SYSTEMD" != "1" ]]; then
  need_command systemctl
  run_root systemctl daemon-reload
  run_root systemctl enable haco.service
  run_root systemctl restart haco.service
  if ! run_root systemctl is-active --quiet haco.service; then
    run_root systemctl status haco.service --no-pager || true
    fail "Haco service did not start; inspect logs with: sudo journalctl -u haco -n 100"
  fi
fi

say ""
say "Haco installation complete."
say "  Service user: $SERVICE_USER"
say "  Binary:       $BIN_PATH"
say "  Configuration: $CONFIG_PATH"
say "  Data:         $DATA_DIR"
if [[ "$ACCESS_MODE" == "public" || "$BIND_ADDRESS" == 0.0.0.0:* || "$BIND_ADDRESS" == \[*\]:* ]]; then
  say "  Open:         http://SERVER_IP:${HACO_PORT}"
  say ""
  say "Warning: direct public access uses plain HTTP. Put Haco behind HTTPS before production use."
  if command -v ufw >/dev/null 2>&1; then
    say "If UFW is active, allow the port with: sudo ufw allow ${HACO_PORT}/tcp"
  fi
else
  say "  Local URL:    http://127.0.0.1:${HACO_PORT}"
  say "  Remote setup: ssh -L ${HACO_PORT}:127.0.0.1:${HACO_PORT} ${SERVICE_USER}@SERVER_IP"
fi
if [[ -n "$OPENCLAW_BIN" ]]; then
  say ""
  say "Next: sign in as the first administrator, then open Settings -> Integrations -> Connect local OpenClaw."
fi
