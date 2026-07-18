use haco::{
    BootstrapResponse, ChatMessage, Conversation, ConversationKind, CreateMessageRequest,
    PrincipalKind,
};
use iced::{
    alignment, executor,
    widget::{button, column, container, horizontal_rule, row, scrollable, text, text_input},
    Application, Command, Element, Length, Settings, Theme,
};

const DEFAULT_SERVER: &str = "http://127.0.0.1:8787";

fn main() -> iced::Result {
    HacoDesktop::run(Settings {
        antialiasing: true,
        ..Settings::default()
    })
}

struct HacoDesktop {
    server: String,
    current_user_id: String,
    conversations: Vec<Conversation>,
    selected_id: Option<String>,
    messages: Vec<ChatMessage>,
    draft: String,
    search: String,
    status: String,
}

#[derive(Debug, Clone)]
enum Message {
    BootstrapLoaded(Result<BootstrapResponse, String>),
    ConversationSelected(String),
    MessagesLoaded(Result<(String, Vec<ChatMessage>), String>),
    DraftChanged(String),
    SendMessage,
    MessageSent(Result<ChatMessage, String>),
    SearchChanged(String),
}

impl Application for HacoDesktop {
    type Executor = executor::Default;
    type Message = Message;
    type Theme = Theme;
    type Flags = ();

    fn new(_: Self::Flags) -> (Self, Command<Message>) {
        let server = std::env::var("HACO_SERVER").unwrap_or_else(|_| DEFAULT_SERVER.to_owned());
        let command = Command::perform(load_bootstrap(server.clone()), Message::BootstrapLoaded);
        (
            Self {
                server,
                current_user_id: "human-alex".into(),
                conversations: Vec::new(),
                selected_id: None,
                messages: Vec::new(),
                draft: String::new(),
                search: String::new(),
                status: "Connecting to Haco…".into(),
            },
            command,
        )
    }

    fn title(&self) -> String {
        "Haco — people and agents".into()
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::BootstrapLoaded(Ok(response)) => {
                self.current_user_id = response.current_user.id;
                self.conversations = response.conversations;
                self.selected_id = self.conversations.first().map(|item| item.id.clone());
                self.messages = response.initial_messages;
                self.status = "Connected".into();
                Command::none()
            }
            Message::BootstrapLoaded(Err(error)) => {
                self.status = format!("Server unavailable: {error}");
                Command::none()
            }
            Message::ConversationSelected(id) => {
                self.selected_id = Some(id.clone());
                self.status = "Loading messages…".into();
                Command::perform(
                    load_messages(self.server.clone(), id),
                    Message::MessagesLoaded,
                )
            }
            Message::MessagesLoaded(Ok((id, messages))) => {
                if self.selected_id.as_deref() == Some(id.as_str()) {
                    self.messages = messages;
                }
                self.status = "Connected".into();
                Command::none()
            }
            Message::MessagesLoaded(Err(error)) => {
                self.status = error;
                Command::none()
            }
            Message::DraftChanged(value) => {
                self.draft = value;
                Command::none()
            }
            Message::SendMessage => {
                let Some(conversation_id) = self.selected_id.clone() else {
                    return Command::none();
                };
                let body = self.draft.trim().to_owned();
                if body.is_empty() {
                    return Command::none();
                }
                self.draft.clear();
                Command::perform(
                    send_message(
                        self.server.clone(),
                        conversation_id,
                        self.current_user_id.clone(),
                        body,
                    ),
                    Message::MessageSent,
                )
            }
            Message::MessageSent(Ok(message)) => {
                self.messages.push(message);
                self.status = "Delivered".into();
                Command::none()
            }
            Message::MessageSent(Err(error)) => {
                self.status = format!("Could not send: {error}");
                Command::none()
            }
            Message::SearchChanged(value) => {
                self.search = value;
                Command::none()
            }
        }
    }

    fn view(&self) -> Element<'_, Message> {
        let sidebar = self.sidebar();
        let main = self.main_panel();
        container(row![sidebar, vertical_divider(), main].height(Length::Fill))
            .width(Length::Fill)
            .height(Length::Fill)
            .padding(16)
            .into()
    }
}

impl HacoDesktop {
    fn sidebar(&self) -> Element<'_, Message> {
        let search = text_input("Search local messages", &self.search)
            .on_input(Message::SearchChanged)
            .padding(10)
            .size(14);
        let mut list = column![
            text("HACO").size(26),
            text("Agent communication hub").size(13),
            search,
            horizontal_rule(1),
            text("CONVERSATIONS").size(12)
        ]
        .spacing(10);
        for item in self.conversations.iter().filter(|item| {
            self.search.is_empty()
                || item
                    .title
                    .to_lowercase()
                    .contains(&self.search.to_lowercase())
                || item
                    .last_message_preview
                    .as_deref()
                    .unwrap_or_default()
                    .to_lowercase()
                    .contains(&self.search.to_lowercase())
        }) {
            let prefix = match item.kind {
                ConversationKind::Channel => "#",
                ConversationKind::Group => "◉",
                ConversationKind::Direct => "@",
            };
            let label = format!("{prefix} {}", item.title);
            let preview = item
                .last_message_preview
                .as_deref()
                .unwrap_or("No messages yet");
            list = list.push(
                button(column![text(label).size(16), text(preview).size(12)].spacing(3))
                    .width(Length::Fill)
                    .on_press(Message::ConversationSelected(item.id.clone())),
            );
        }
        container(list.width(220)).padding([8, 12]).into()
    }

    fn main_panel(&self) -> Element<'_, Message> {
        let selected = self
            .conversations
            .iter()
            .find(|item| Some(&item.id) == self.selected_id.as_ref());
        let heading = selected
            .map(|item| match item.kind {
                ConversationKind::Channel => format!("# {}", item.title),
                ConversationKind::Group => format!("{} · group", item.title),
                ConversationKind::Direct => format!("{} · direct", item.title),
            })
            .unwrap_or_else(|| "Choose a conversation".into());
        let description = selected
            .and_then(|item| item.description.as_deref())
            .unwrap_or("Select a channel, group, or direct message.");
        let mut feed = column![].spacing(14);
        for message in &self.messages {
            feed = feed.push(message_view(message));
        }
        let composer = text_input("Write a message…", &self.draft)
            .on_input(Message::DraftChanged)
            .on_submit(Message::SendMessage)
            .padding(12)
            .size(16)
            .width(Length::Fill);
        let content = column![
            column![
                text(heading).size(25),
                text(description).size(14),
                text(&self.status).size(12)
            ]
            .spacing(4),
            horizontal_rule(1),
            scrollable(feed.padding([4, 8])).height(Length::Fill),
            row![
                composer,
                button(text("Send"))
                    .padding(12)
                    .on_press(Message::SendMessage)
            ]
            .spacing(8)
            .align_items(alignment::Alignment::Center),
        ]
        .spacing(12)
        .height(Length::Fill);
        container(content)
            .padding([8, 16])
            .width(Length::Fill)
            .into()
    }
}

fn message_view(message: &ChatMessage) -> Element<'_, Message> {
    let kind = if message.sender.kind == PrincipalKind::Agent {
        "AGENT"
    } else {
        "HUMAN"
    };
    let mut card = column![
        row![
            text(&message.sender.display_name).size(16),
            text(kind).size(11),
            text(message.created_at.format("%H:%M").to_string()).size(12)
        ]
        .spacing(8),
        text(&message.body).size(16),
    ]
    .spacing(6);
    if let Some(activity) = &message.activity {
        let tool = activity.tool_name.as_deref().unwrap_or("agent activity");
        card = card.push(
            container(
                column![
                    text(format!("{} · {}", activity.status.to_uppercase(), tool)).size(12),
                    text(&activity.summary).size(13)
                ]
                .spacing(4),
            )
            .padding(9),
        );
    }
    if !message.attachments.is_empty() {
        for attachment in &message.attachments {
            card = card.push(
                text(format!(
                    "📎 {} ({})",
                    attachment.file_name, attachment.media_type
                ))
                .size(13),
            );
        }
    }
    let thread_marker = message
        .parent_message_id
        .as_ref()
        .map(|_| "↳ thread reply")
        .unwrap_or("");
    card = card.push(text(thread_marker).size(12));
    container(card).padding(12).width(Length::Fill).into()
}

fn vertical_divider<'a>() -> Element<'a, Message> {
    container(" ")
        .width(Length::Fixed(1.0))
        .height(Length::Fill)
        .into()
}

async fn load_bootstrap(server: String) -> Result<BootstrapResponse, String> {
    reqwest::get(format!("{server}/api/bootstrap"))
        .await
        .map_err(|error| error.to_string())?
        .json()
        .await
        .map_err(|error| error.to_string())
}

async fn load_messages(
    server: String,
    conversation_id: String,
) -> Result<(String, Vec<ChatMessage>), String> {
    let url = format!("{server}/api/conversations/{conversation_id}/messages");
    let messages = reqwest::get(url)
        .await
        .map_err(|error| error.to_string())?
        .json()
        .await
        .map_err(|error| error.to_string())?;
    Ok((conversation_id, messages))
}

async fn send_message(
    server: String,
    conversation_id: String,
    sender_id: String,
    body: String,
) -> Result<ChatMessage, String> {
    reqwest::Client::new()
        .post(format!(
            "{server}/api/conversations/{conversation_id}/messages"
        ))
        .json(&CreateMessageRequest {
            sender_id,
            body,
            parent_message_id: None,
            attachments: vec![],
        })
        .send()
        .await
        .map_err(|error| error.to_string())?
        .error_for_status()
        .map_err(|error| error.to_string())?
        .json()
        .await
        .map_err(|error| error.to_string())
}
