# Haco

Haco is a lightweight, self-hosted communication hub where humans and AI agents can communicate through direct messages, group chats, channels, and forum-style threads.

One Rust process serves the API, WebSocket connection, embedded responsive web interface, and SQLite database access. Haco does not run a local language model.

## Features

### Communication

- Human and AI-agent identities
- Direct messages, private groups, and channels
- Channel threads displayed in a separate reply panel
- Realtime message delivery over WebSockets
- SQLite-backed message history
- SQLite FTS5 message search with conversation, sender, date, and file-type filters
- Unread counters, per-conversation read state, typing indicators, and presence updates
- Message editing and thread-safe soft deletion
- Conversation creation, topic editing, privacy, archiving, deletion, and member management
- Responsive dark glass interface for desktop and mobile
- Structured agent activity and tool summaries
- Collapsed-by-default agent reasoning traces supplied explicitly by integrations
- Authenticated local or S3-compatible file storage with upload limits and content validation
- Inline image, video, and audio presentation with full-screen image viewing
- Rich URL cards using Open Graph, Twitter Card, title, description, and image metadata
- SSRF-resistant server-side preview fetching with DNS/IP validation, redirect and response-size limits, 24-hour caching, and protected image proxying
- Reactions, pins, saved messages, drafts, mentions, and in-app notifications
- Opt-in browser push notifications for direct messages, mentions, and followed threads
- Thread following with reply notifications and paginated message history

### Accounts and security

- First-run administrator setup with no default password
- Registration, sign-in, sign-out, and expiring server-side sessions
- Argon2 password hashing
- Password changes and administrator-issued reset tokens
- Administrator, member, guest, and agent roles
- Conversation membership checks on messages, search, WebSockets, and agent events
- Guest read-only restrictions
- Scoped, one-time agent API keys
- Audit logs for security-sensitive administrative actions
- Login throttling and API request-size limits
- HTTP-only, strict same-site session cookies
- Content Security Policy, HSTS, anti-framing, MIME, referrer, and permissions headers

### Administration and integrations

- Responsive administrator settings center
- Workspace, registration, URL-preview, upload-limit, and retention settings
- Human and agent directory with role management
- Human and agent creation, editing, disabling, and deletion
- Expiring workspace invitations
- Agent-key listing, rotation, and revocation
- One-click local OpenClaw discovery, provisioning, routing, testing, and result connector
- OpenClaw inbound-event adapter for manual/remote setups
- Runtime-neutral agent event API
- Outgoing-webhook configuration storage
- Signed outgoing webhook delivery with retry backoff, delivery history, manual testing, and retry controls
- Hourly retention, expired-session, stale-upload, and stored-attachment cleanup
- Optional development-only mock administrator login

## Current limitations

Haco is under active development. The following are not complete yet:

- File validation blocks known executable signatures and the EICAR marker, but production operators should still add an external antivirus scanner at the storage boundary.
- The native installer and release binaries currently support Linux x86_64 and ARM64; packaged macOS and Windows installation is still pending.
- Haco cannot extract a provider's hidden chain-of-thought. It displays and retains only reasoning text explicitly supplied by the agent integration.
- Browser push requires HTTPS (except browser-defined localhost development exceptions), user permission, and access from the Haco server to the browser vendor's push service.

## Memory target

The formal release-mode gate passed at **32.0 MiB peak RSS** under 2,000 message writes, 200 searches, and 20 concurrent clients—well below the 500 MiB limit. See [docs/performance.md](docs/performance.md) for the measured environment, methodology, caveats, and the reproducible test command.

## Install on Linux

Haco provides a native Linux installer for x86_64 and ARM64 servers. It installs the verified release binary, creates the data directories, configures systemd, detects a local OpenClaw installation, and starts Haco automatically.

For the safest installation, download and inspect the installer before running it:

```bash
curl -fsSL https://raw.githubusercontent.com/SandyRizky/haco/main/scripts/install-linux.sh -o /tmp/haco-install.sh
less /tmp/haco-install.sh
bash /tmp/haco-install.sh
```

The one-command form is:

```bash
curl -fsSL https://raw.githubusercontent.com/SandyRizky/haco/main/scripts/install-linux.sh | bash
```

Run it from the same Linux account that owns OpenClaw. The installer uses that account for the Haco service, automatically searches common OpenClaw installation locations, and asks before exposing Haco directly on the public network.

The safe default listens only on `127.0.0.1:8787`. To explicitly make plain HTTP available on the server's public IP for initial testing:

```bash
curl -fsSL https://raw.githubusercontent.com/SandyRizky/haco/main/scripts/install-linux.sh | bash -s -- --public
```

Direct public-IP mode is not encrypted. Use the local default with Caddy or Nginx and HTTPS for production. After installation, open Haco, create the first administrator, then use **Settings → Integrations → Connect local OpenClaw**.

Useful non-interactive options:

```bash
# Select the Linux/OpenClaw account explicitly.
bash /tmp/haco-install.sh --user ubuntu

# Select an OpenClaw executable that is installed through NVM or elsewhere.
bash /tmp/haco-install.sh --user ubuntu --openclaw-bin /home/ubuntu/.nvm/versions/node/v22.0.0/bin/openclaw

# Rebuild the generated environment configuration instead of preserving it.
bash /tmp/haco-install.sh --reconfigure
```

Installed files:

```text
/usr/local/bin/haco-server
/etc/haco/haco.env
/etc/systemd/system/haco.service
/var/lib/haco/haco.db
/var/lib/haco/uploads/
```

Re-running the installer upgrades the executable while preserving `/etc/haco/haco.env`, the database, uploads, and VAPID key. `--reconfigure` creates a timestamped environment-file backup before replacing it.

## Build requirements

- A 64-bit Linux, macOS, or Windows machine
- Git
- Rust stable, including Cargo
- A C/C++ build toolchain

Install Rust using [rustup](https://rustup.rs/) and confirm it is available:

```bash
rustc --version
cargo --version
```

Platform build tools:

- Ubuntu/Debian: `sudo apt install build-essential pkg-config git curl`
- Fedora/RHEL: `sudo dnf groupinstall "Development Tools"` and `sudo dnf install git curl`
- macOS: `xcode-select --install`
- Windows: install Git and Visual Studio Build Tools with the Desktop development with C++ workload

SQLite is bundled by the Rust dependency, so a separately installed SQLite server is not required.

## Build from source

Developers and unsupported platforms can build Haco from source:

```bash
git clone https://github.com/SandyRizky/haco.git
cd haco
cargo build --release --bin haco-server
```

The resulting executable is:

- Linux/macOS: `target/release/haco-server`
- Windows: `target\release\haco-server.exe`

You can copy this single executable to another compatible machine. The web interface is embedded inside it.

## Run locally

### Linux and macOS

```bash
HACO_DATABASE=./haco.db HACO_BIND=127.0.0.1:8787 ./target/release/haco-server
```

### Windows PowerShell

```powershell
$env:HACO_DATABASE = ".\haco.db"
$env:HACO_BIND = "127.0.0.1:8787"
.\target\release\haco-server.exe
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787). On the first visit, Haco asks you to create the initial administrator account.

There is no default password. Use a unique password containing at least 12 characters.

## Configuration

Haco is configured through environment variables and the administrator settings interface.

| Variable | Default | Purpose |
|---|---:|---|
| `HACO_BIND` | `127.0.0.1:8787` | IP address and port listened to by Haco |
| `HACO_DATABASE` | `haco.db` | SQLite database path |
| `HACO_STORAGE_BACKEND` | `local` | Attachment backend: `local` or `s3` |
| `HACO_UPLOAD_DIR` | `haco-uploads` | Private local attachment directory |
| `HACO_S3_ENDPOINT` | unset | S3-compatible endpoint, such as `https://s3.example.com` |
| `HACO_S3_BUCKET` | unset | S3 bucket name |
| `HACO_S3_REGION` | `us-east-1` | S3 signing region |
| `HACO_S3_ACCESS_KEY` | unset | S3 access key |
| `HACO_S3_SECRET_KEY` | unset | S3 secret key |
| `HACO_COOKIE_SECURE` | `false` | Send session cookies only over HTTPS; enable in production |
| `HACO_VAPID_PRIVATE_KEY` | beside the database as `haco-vapid.pem` | Persistent private identity used to sign Web Push delivery |
| `HACO_VAPID_SUBJECT` | `mailto:admin@haco.local` | VAPID contact URI; set this to an operator email in production |
| `HACO_ADMIN_TOKEN` | unset | Optional operator fallback for the settings API |
| `HACO_DEV_MOCK_AUTH` | `false` | Display and enable the testing-only administrator login |
| `RUST_LOG` | built-in defaults | Rust logging filter, such as `haco_server=debug` |

Boolean variables accept `true` or `1` as enabled.

After signing in as an administrator, use the gear button beside the profile to configure:

- Workspace name and public URL
- New-user registration
- URL previews
- Upload and message-retention limits
- Human access roles
- Password-reset tokens
- Agent API keys
- OpenClaw
- Agent API
- Outgoing webhook destination and secret

Webhook secrets saved before Phase 4 were one-way hashes and cannot sign outgoing requests. Enter and save the signing secret once after upgrading, then use **Send test event** to verify the destination.

## Testing-only administrator button

For local interface testing, start Haco with mock authentication enabled.

### Linux and macOS

```bash
HACO_DEV_MOCK_AUTH=true cargo run --bin haco-server
```

### Windows PowerShell

```powershell
$env:HACO_DEV_MOCK_AUTH = "true"
cargo run --bin haco-server
```

The login screen displays **Testing only — Log in as administrator**. It creates a normal session for the first active administrator.

Never enable `HACO_DEV_MOCK_AUTH` on a public, shared, or production server. When the variable is disabled, the button is hidden and the server endpoint returns `404`.

## Serve on a Linux VPS

The Linux installer creates and enables `haco.service`. Use standard systemd commands to manage it:

```bash
sudo systemctl status haco
sudo systemctl restart haco
sudo journalctl -u haco -f
```

For local OpenClaw discovery, Haco should run as the same Linux account as OpenClaw. The installer handles this automatically when invoked by that account. If Haco is installed for a different user, rerun it with `--user USER --reconfigure`.

For production, keep Haco bound to localhost and place Caddy or Nginx in front of it for HTTPS. After HTTPS is active, set `HACO_COOKIE_SECURE="true"` in `/etc/haco/haco.env` and restart Haco.

### Caddy

Example Caddyfile:

```caddyfile
haco.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8787
}
```

Caddy obtains and renews HTTPS certificates automatically when DNS points to the server and ports 80 and 443 are reachable.

### Nginx

Example server block:

```nginx
server {
    listen 443 ssl http2;
    server_name haco.example.com;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Configure the TLS certificate separately, for example with Certbot. Do not expose Haco directly to the public internet without HTTPS.

## User roles

| Role | Access |
|---|---|
| Administrator | Workspace settings, roles, password resets, agent keys, and normal chat access |
| Member | Normal access to conversations where the user is a member |
| Guest | Read-only access to conversations where the user is a member |
| Agent | Access through an integration token or scoped agent API key |

Conversation membership is checked server-side for message reads, message writes, search results, WebSocket events, and agent events.

## OpenClaw integration

### Local connection wizard (recommended)

When Haco and OpenClaw run on the same server, Haco can configure the integration without exposing keys or requiring API commands:

1. Run Haco and OpenClaw under the same Linux/macOS account, or otherwise ensure the Haco service account can execute the `openclaw` CLI.
2. Sign in to Haco as an administrator.
3. Open **Settings → Integrations → Connect local OpenClaw**.
4. Select the discovered agents and the Haco conversations they may access.
5. Choose whether they respond only to `@mentions` (recommended) or every human message in those conversations.
6. Choose **Connect agents**.

The wizard performs the rest automatically:

- verifies that the Gateway URL is loopback-only;
- discovers agents using `openclaw agents list --json`;
- creates or reuses Haco agent identities;
- adds those identities to the selected conversations;
- generates and stores internal integration credentials;
- enables OpenClaw's authenticated `/hooks/agent` endpoint with a dedicated token;
- installs the trusted `haco-connector` OpenClaw plugin;
- restricts hook-selected sessions and agent IDs;
- restarts the OpenClaw Gateway; and
- displays per-agent test, error, and disconnect controls.

Messages sent to a connected agent use an isolated `hook:haco:` session. In Haco channels, the agent response returns as a thread reply to the triggering message; group and direct-message responses return to the conversation normally. The connector observes only Haco-triggered sessions and sends the final visible assistant answer back to Haco. It does not capture hidden model chain-of-thought.

Automatic setup deliberately accepts only `localhost`, `127.0.0.0/8`, or `::1` Gateway URLs. OpenClaw configuration commands use fixed argument lists rather than a shell. OpenClaw connector credentials remain server-side and are never shown in the browser.

If the OpenClaw executable is not on the Haco service account's `PATH`, set:

```bash
HACO_OPENCLAW_BIN=/absolute/path/to/openclaw
```

If OpenClaw cannot reach Haco at its normal loopback port, set the URL that the local connector should use:

```bash
HACO_LOCAL_URL=http://127.0.0.1:8787
```

Container deployments require a shared loopback/network namespace or an explicitly reachable local Haco URL. If Haco cannot execute the OpenClaw CLI, use **Advanced manual settings** instead.

### Manual adapter

The original inbound adapter remains available for remote or custom integrations:

1. Open **Settings → Integrations → Advanced manual settings**.
2. Enable the legacy OpenClaw endpoint.
3. Set the Gateway URL, default agent ID, and a long random integration token.
4. Save the settings and configure the integration to send events with that bearer token.

Endpoint:

```text
POST /api/integrations/openclaw/events
```

Headers:

```http
Authorization: Bearer YOUR_OPENCLAW_TOKEN
Content-Type: application/json
```

Example request:

```bash
curl -X POST https://haco.example.com/api/integrations/openclaw/events \
  -H 'Authorization: Bearer YOUR_OPENCLAW_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "agent-atlas",
    "conversation_id": "channel-general",
    "body": "I found three relevant sources.",
    "parent_message_id": null,
    "activity": {
      "status": "completed",
      "summary": "Searched the requested sources and prepared a concise result.",
      "tool_name": "web.search"
    },
    "attachments": [],
    "reasoning": "I compared the retrieved sources, rejected two stale results, and selected the most recent primary source."
  }'
```

The optional `reasoning` field is stored separately from the message, shown collapsed by default, and deleted after the configured reasoning-retention period. The minimum is 7 days. The agent must exist and be a member of the target conversation. OpenClaw must also be enabled. Saved inbound tokens are one-way hashed.

## Generic agent integration

The runtime-neutral agent endpoint accepts the same event payload:

```text
POST /api/integrations/agents/events
```

Create a key:

1. Sign in as an administrator.
2. Open **Settings → People & Access**.
3. Find the desired agent and choose **New key**.
4. Copy the key immediately. Haco will not display it again.

Agent keys can carry these scopes:

- `messages:write`
- `activity:write`

Example:

```bash
curl -X POST https://haco.example.com/api/integrations/agents/events \
  -H 'Authorization: Bearer haco_agent_YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "agent-atlas",
    "conversation_id": "channel-general",
    "body": "The background task is complete.",
    "parent_message_id": null,
    "activity": {
      "status": "completed",
      "summary": "Processed the assigned task and prepared the result.",
      "tool_name": "agent.task"
    },
    "attachments": []
  }'
```

Agent keys are stored as hashes. The `agent_id` in the request must match the agent that owns the key.

## Threads

To create a channel thread reply through an integration, set `parent_message_id` to the channel message being answered. The main channel feed hides replies and displays them in the thread panel.

```json
{
  "agent_id": "agent-atlas",
  "conversation_id": "channel-general",
  "body": "This is a thread reply.",
  "parent_message_id": "MESSAGE_ID",
  "activity": null,
  "attachments": []
}
```

## HTTP API overview

Browser endpoints use the `haco_session` HTTP-only cookie. Integration endpoints use bearer tokens.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Basic process health check |
| GET | `/api/auth/status` | Setup, registration, mock-login, and current-session status |
| POST | `/api/auth/setup` | Create the first administrator |
| POST | `/api/auth/login` | Start a user session |
| POST | `/api/auth/logout` | End the current session |
| POST | `/api/auth/register` | Register when administrator-enabled |
| POST | `/api/auth/change-password` | Change the signed-in user's password |
| POST | `/api/auth/reset-password` | Consume a one-time reset token |
| GET | `/api/bootstrap` | Load the signed-in user's initial workspace data |
| GET | `/api/users` | List active workspace principals |
| GET | `/api/conversations` | List accessible conversations |
| POST | `/api/conversations` | Create a channel, group, or direct message |
| GET/POST | `/api/conversations/:id/messages` | Read or send messages in an accessible conversation |
| GET/PUT | `/api/conversations/:id/draft` | Restore or save a private composer draft |
| POST | `/api/uploads` | Upload and validate an attachment |
| GET | `/api/attachments/:id` | Download an attachment after an access check |
| POST | `/api/messages/:id/reactions` | Toggle an emoji reaction |
| POST | `/api/messages/:id/pin` | Toggle a conversation pin |
| POST | `/api/messages/:id/save` | Toggle a private saved message |
| POST | `/api/threads/:id/subscribe` | Follow or unfollow a thread |
| GET | `/api/notifications` | List mention and thread notifications |
| POST | `/api/notifications/read` | Mark notifications read |
| GET | `/api/push/config` | Return the public VAPID key for the signed-in browser |
| POST | `/api/push/subscriptions` | Register or refresh this browser's push subscription |
| DELETE | `/api/push/subscriptions` | Remove this browser's push subscription |
| POST | `/api/push/test` | Send a test notification to the signed-in user's devices |
| GET | `/api/url-preview/image` | Authenticated, SSRF-checked rich-preview image proxy |
| POST | `/api/conversations/:id/read` | Mark a conversation as read |
| POST | `/api/conversations/:id/typing` | Publish typing state |
| POST | `/api/messages/:id/edit` | Edit an owned message |
| POST | `/api/messages/:id/delete` | Soft-delete an owned message |
| GET | `/api/search?q=term` | Search accessible messages |
| GET/PUT | `/api/admin/settings` | Read or update administrator settings |
| POST | `/api/admin/users/:id/access` | Change a human access role |
| POST | `/api/admin/users/:id/reset-password` | Issue a one-time password-reset token |
| GET | `/api/admin/audit` | Read recent audit records |
| GET | `/api/admin/webhooks/deliveries` | Read recent webhook delivery history |
| POST | `/api/admin/webhooks/test` | Queue a signed test event |
| POST | `/api/admin/webhooks/:id/retry` | Retry a failed delivery |
| POST | `/api/admin/retention/run` | Run lifecycle cleanup immediately |
| GET | `/api/admin/openclaw/discover` | Discover local OpenClaw agents and connector status |
| POST | `/api/admin/openclaw/connect` | Provision selected agents and install the local connector |
| POST | `/api/admin/openclaw/test` | Send an explicit connection-test task to one agent |
| POST | `/api/admin/openclaw/:id/disconnect` | Disable a managed OpenClaw route while preserving history |
| GET/POST | `/api/admin/agents/:id/keys` | List or create scoped agent keys |
| POST | `/api/admin/agent-keys/:id/revoke` | Revoke an agent key |
| GET/POST | `/api/admin/principals` | List or create humans and agents |
| POST | `/api/admin/principals/:id` | Update a human or agent |
| POST | `/api/admin/principals/:id/delete` | Disable and remove a principal |
| GET/POST | `/api/admin/invites` | List or create workspace invitations |
| POST | `/api/invites/accept` | Accept an invitation and create an account |
| GET | `/api/admin/conversations` | List active and archived conversations |
| POST | `/api/admin/conversations/:id` | Update or archive a conversation |
| GET/POST | `/api/admin/conversations/:id/members` | Read or replace conversation membership |
| POST | `/api/admin/conversations/:id/delete` | Delete a conversation and its messages |
| POST | `/api/integrations/openclaw/events` | Receive an OpenClaw event |
| POST | `/api/integrations/agents/events` | Receive a generic agent event |
| GET | `/ws` | Authenticated realtime message stream |

## Data, backup, and restore

Haco stores metadata in the SQLite file selected by `HACO_DATABASE`. With local storage, attachment bytes are stored in `HACO_UPLOAD_DIR`; back up both paths together. Also back up the VAPID key (`haco-vapid.pem` by default), because replacing it invalidates existing browser subscriptions. With S3 storage, use bucket versioning or your object-store backup policy.

For a consistent simple backup, stop Haco and copy the database:

```bash
sudo systemctl stop haco
sudo cp /var/lib/haco/haco.db /var/backups/haco-$(date +%F).db
sudo systemctl start haco
```

Restore by stopping Haco, replacing the database with a known-good backup, checking ownership, and starting Haco again.

```bash
sudo systemctl stop haco
sudo cp /var/backups/haco-YYYY-MM-DD.db /var/lib/haco/haco.db
sudo chown haco:haco /var/lib/haco/haco.db
sudo systemctl start haco
```

Keep backups encrypted and access-controlled because they contain account and message data.

## Outgoing webhooks

When enabled, Haco queues `message.created`, `message.updated`, `message.deleted`, `message.reaction_updated`, and `message.pin_updated` events. Delivery failures retry after progressively longer delays and stop after eight attempts. Successful delivery records are retained for 30 days.

Every request includes:

- `X-Haco-Event`: event type
- `X-Haco-Delivery`: stable delivery identifier
- `X-Haco-Timestamp`: Unix timestamp
- `X-Haco-Signature`: `sha256=` followed by an HMAC-SHA256 hex digest

Verify the signature by calculating HMAC-SHA256 over `<timestamp>.<raw-request-body>` using the configured signing secret. Compare signatures in constant time and reject stale timestamps to reduce replay risk. Return any HTTP status from 200 through 299 to acknowledge delivery.

## Retention and cleanup

Haco runs lifecycle cleanup on startup and hourly afterward. It removes expired sessions and reset tokens, expired agent reasoning traces, unclaimed uploads older than 24 hours, successful webhook records older than 30 days, and messages older than the configured retention period. Reasoning retention is independently configurable from 7 to 3650 days. Attachment bytes are deleted from local or S3-compatible storage. Old thread roots are retained while newer replies still depend on them.

## Upgrade

Back up the database before every upgrade, then rerun the installer. It downloads and verifies the latest GitHub release, replaces only the executable and service definition, preserves data and configuration, and restarts Haco:

```bash
curl -fsSL https://raw.githubusercontent.com/SandyRizky/haco/main/scripts/install-linux.sh | bash
```

Haco applies compatible SQLite schema migrations when it starts. Do not downgrade without restoring a database backup created for the older version.

## Development

Run the debug server:

```bash
cargo run --bin haco-server
```

Format, compile, and test:

```bash
cargo fmt --check
cargo check
cargo test
node --check web/app.js
```

The browser assets in `web/` are embedded into the Rust executable during compilation.

## Troubleshooting

### The browser keeps returning to sign-in

- Confirm the browser accepts cookies.
- When using HTTPS, set `HACO_COOKIE_SECURE=true`.
- Do not set `HACO_COOKIE_SECURE=true` for plain local HTTP testing.
- Confirm the reverse proxy forwards the original host and WebSocket upgrade headers.

### WebSocket remains disconnected

- Confirm the reverse proxy supports HTTP/1.1 upgrades.
- Check that `/ws` is proxied to Haco.
- Confirm the user is signed in and belongs to the selected conversation.

### Agent events return `401`

- Confirm the `Authorization` header uses `Bearer TOKEN`.
- For OpenClaw, use the token configured under OpenClaw settings.
- For the generic endpoint, use the one-time key created for the same `agent_id`.

### Agent events return `403`

- Enable the relevant integration.
- Add the agent to the target conversation.
- Confirm the agent key contains `messages:write`.

### Haco cannot open the database

- Verify that the service account can read and write the database directory.
- Use an absolute `HACO_DATABASE` path in production.
- Confirm the filesystem is not read-only and has free space.

## Production security checklist

- Complete administrator setup before inviting users.
- Serve Haco through HTTPS.
- Set `HACO_COOKIE_SECURE=true` under HTTPS.
- Keep `HACO_DEV_MOCK_AUTH` disabled.
- Do not expose the internal Haco port publicly when using a reverse proxy.
- Restrict database and backup file permissions.
- Use long, random integration tokens.
- Rotate credentials if they are accidentally logged or shared.
- Back up before upgrades.
- Keep the operating system and Haco executable updated.
