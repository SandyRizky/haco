//! Shared API types for the Haco server and native client.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PrincipalKind {
    Human,
    Agent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Principal {
    pub id: String,
    pub display_name: String,
    pub username: String,
    pub email: Option<String>,
    pub kind: PrincipalKind,
    pub access_role: String,
    pub presence: String,
    pub disabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConversationKind {
    Direct,
    Group,
    Channel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub kind: ConversationKind,
    pub title: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub is_private: bool,
    pub archived: bool,
    pub member_count: u32,
    pub unread_count: u32,
    pub last_message_preview: Option<String>,
    pub last_message_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationMember {
    pub principal: Principal,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentActivity {
    pub status: String,
    /// A deliberately short, user-visible explanation—not hidden model reasoning.
    pub summary: String,
    pub tool_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: String,
    pub file_name: String,
    pub media_type: String,
    pub byte_size: u64,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrlPreview {
    pub url: String,
    pub title: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
}

/// An explicit, user-visible reasoning trace supplied by an agent integration.
/// This is application data, not hidden model chain-of-thought.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningTrace {
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReactionSummary {
    pub emoji: String,
    pub count: u32,
    pub reacted_by_me: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub conversation_id: String,
    pub parent_message_id: Option<String>,
    pub sender: Principal,
    pub body: String,
    pub created_at: DateTime<Utc>,
    pub edited_at: Option<DateTime<Utc>>,
    pub is_deleted: bool,
    pub activity: Option<AgentActivity>,
    pub attachments: Vec<Attachment>,
    #[serde(default)]
    pub reactions: Vec<ReactionSummary>,
    #[serde(default)]
    pub is_pinned: bool,
    #[serde(default)]
    pub is_saved: bool,
    pub url_preview: Option<UrlPreview>,
    pub reasoning: Option<ReasoningTrace>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapResponse {
    pub current_user: Principal,
    pub conversations: Vec<Conversation>,
    pub initial_messages: Vec<ChatMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMessageRequest {
    pub sender_id: String,
    pub body: String,
    pub parent_message_id: Option<String>,
    #[serde(default)]
    pub attachments: Vec<Attachment>,
    #[serde(default)]
    pub reasoning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenClawEvent {
    pub agent_id: String,
    pub conversation_id: String,
    pub body: String,
    pub parent_message_id: Option<String>,
    pub activity: Option<AgentActivity>,
    #[serde(default)]
    pub attachments: Vec<Attachment>,
    #[serde(default)]
    pub reasoning: Option<String>,
    /// Stable identifier supplied by an integration so retries are idempotent.
    #[serde(default)]
    pub delivery_id: Option<String>,
    /// Correlates the admin connection test with the actual agent callback.
    #[serde(default)]
    pub test_id: Option<String>,
    /// Prevents an agent-to-agent DM from recursively bouncing forever.
    #[serde(default)]
    pub relay_depth: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum RealtimeEvent {
    MessageCreated(ChatMessage),
    MessageUpdated(ChatMessage),
    MessageDeleted {
        message_id: String,
        conversation_id: String,
    },
    ReasoningUpdate {
        conversation_id: String,
        principal: Principal,
        #[serde(default)]
        parent_message_id: Option<String>,
        content: String,
        done: bool,
    },
    Typing {
        conversation_id: String,
        principal: Principal,
        active: bool,
    },
    PresenceUpdated(Principal),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminSettings {
    pub workspace_name: String,
    pub public_url: String,
    pub registration_enabled: bool,
    pub url_previews_enabled: bool,
    pub max_upload_mb: u32,
    pub data_retention_days: u32,
    #[serde(default = "default_reasoning_retention_days")]
    pub reasoning_retention_days: u32,
    pub openclaw_enabled: bool,
    pub openclaw_gateway_url: String,
    pub openclaw_agent_id: String,
    pub openclaw_token_configured: bool,
    pub webhooks_enabled: bool,
    pub webhook_url: String,
    pub webhook_secret_configured: bool,
    pub agent_api_enabled: bool,
}

impl Default for AdminSettings {
    fn default() -> Self {
        Self {
            workspace_name: "Haco workspace".into(),
            public_url: String::new(),
            registration_enabled: false,
            url_previews_enabled: true,
            max_upload_mb: 25,
            data_retention_days: 0,
            reasoning_retention_days: 7,
            openclaw_enabled: false,
            openclaw_gateway_url: "http://127.0.0.1:18789".into(),
            openclaw_agent_id: "agent-atlas".into(),
            openclaw_token_configured: false,
            webhooks_enabled: false,
            webhook_url: String::new(),
            webhook_secret_configured: false,
            agent_api_enabled: true,
        }
    }
}

fn default_reasoning_retention_days() -> u32 {
    7
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminSettingsUpdate {
    pub settings: AdminSettings,
    pub openclaw_token: Option<String>,
    pub webhook_secret: Option<String>,
}
