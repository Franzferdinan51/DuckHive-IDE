//! Tauri IPC Commands
//!
//! These commands are exposed to the frontend via JSON-RPC over IPC.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;
use thiserror::Error;

/// Error types for IPC commands
#[derive(Error, Debug)]
pub enum CommandError {
    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("Tool not found: {0}")]
    ToolNotFound(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Agent error: {0}")]
    AgentError(String)
}

impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Session state managed by the backend
#[derive(Default)]
pub struct SessionStore {
    sessions: Mutex<HashMap<String, Session>>,
    config: Mutex<Config>
}

/// Agent session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub status: SessionStatus,
    pub messages: Vec<Message>,
    pub model: String,
    pub provider: String,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "updatedAt")]
    pub updated_at: u64
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Idle,
    Preparing,
    Running,
    AwaitingApproval,
    Paused,
    Recovering,
    Completed,
    Failed,
    Cancelled
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub role: String,
    pub content: String,
    #[serde(rename = "toolCalls")]
    pub tool_calls: Option<Vec<ToolCall>>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: HashMap<String, serde_json::Value>,
    pub status: String,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub version: String,
    pub providers: HashMap<String, ProviderConfig>,
    #[serde(rename = "agentModels")]
    pub agent_models: HashMap<String, String>,
    pub workspace: WorkspaceConfig,
    pub council: CouncilConfig,
    pub tools: ToolsConfig,
    pub ui: UIConfig
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    #[serde(rename = "api_key")]
    pub api_key: Option<String>,
    #[serde(rename = "base_url")]
    pub base_url: Option<String>,
    pub model: Option<String>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub path: String,
    #[serde(rename = "autoLoadDUCK")]
    pub auto_load_duck: bool
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouncilConfig {
    pub enabled: bool,
    #[serde(rename = "debateThreshold")]
    pub debate_threshold: f64,
    #[serde(rename = "maxCouncilors")]
    pub max_councilors: u32
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolsConfig {
    #[serde(rename = "bashEnabled")]
    pub bash_enabled: bool,
    #[serde(rename = "dockerSandbox")]
    pub docker_sandbox: bool
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIConfig {
    pub theme: String,
    #[serde(rename = "fontSize")]
    pub font_size: u32,
    #[serde(rename = "panelLayout")]
    pub panel_layout: String
}

impl Default for Config {
    fn default() -> Self {
        Config {
            version: "1".to_string(),
            providers: HashMap::new(),
            agent_models: HashMap::new(),
            workspace: WorkspaceConfig {
                path: "~/duckhive-projects".to_string(),
                auto_load_duck: true
            },
            council: CouncilConfig {
                enabled: true,
                debate_threshold: 0.7,
                max_councilors: 5
            },
            tools: ToolsConfig {
                bash_enabled: true,
                docker_sandbox: false
            },
            ui: UIConfig {
                theme: "dark".to_string(),
                font_size: 14,
                panel_layout: "right".to_string()
            }
        }
    }
}

/// Tool definition for registry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    #[serde(rename = "inputSchema")]
    pub input_schema: serde_json::Value
}

// ============ IPC Command Handlers ============

/// Create a new agent session
#[tauri::command]
pub fn create_session(
    store: State<'_, SessionStore>,
    model: Option<String>,
    provider: Option<String>
) -> Result<Session, CommandError> {
    let session = Session {
        id: generate_id(),
        status: SessionStatus::Idle,
        messages: Vec::new(),
        model: model.unwrap_or_else(|| "minimax-01".to_string()),
        provider: provider.unwrap_or_else(|| "minimax".to_string()),
        created_at: now_millis(),
        updated_at: now_millis()
    };

    let mut sessions = store.sessions.lock().unwrap();
    sessions.insert(session.id.clone(), session.clone());

    log::info!("Created session: {}", session.id);
    Ok(session)
}

/// Get a session by ID
#[tauri::command]
pub fn get_session(
    store: State<'_, SessionStore>,
    session_id: String
) -> Result<Session, CommandError> {
    let sessions = store.sessions.lock().unwrap();
    sessions
        .get(&session_id)
        .cloned()
        .ok_or_else(|| CommandError::SessionNotFound(session_id))
}

/// Send a message to an agent session
#[tauri::command]
pub async fn send_message(
    store: State<'_, SessionStore>,
    session_id: String,
    content: String
) -> Result<Message, CommandError> {
    // In a real implementation, this would invoke the TypeScript AgentCore
    // For now, we create a placeholder response

    let message = Message {
        id: generate_id(),
        role: "assistant".to_string(),
        content: format!("DuckHive-IDE AgentCore response placeholder. Message received: {}", content),
        tool_calls: None
    };

    // Update session
    {
        let mut sessions = store.sessions.lock().unwrap();
        if let Some(session) = sessions.get_mut(&session_id) {
            session.messages.push(message.clone());
            session.updated_at = now_millis();
        }
    }

    Ok(message)
}

/// List all active sessions
#[tauri::command]
pub fn list_sessions(store: State<'_, SessionStore>) -> Result<Vec<Session>, CommandError> {
    let sessions = store.sessions.lock().unwrap();
    Ok(sessions.values().cloned().collect())
}

/// Get the current configuration
#[tauri::command]
pub fn get_config(store: State<'_, SessionStore>) -> Result<Config, CommandError> {
    let config = store.config.lock().unwrap();
    Ok(config.clone())
}

/// Save configuration
#[tauri::command]
pub fn save_config(
    store: State<'_, SessionStore>,
    config: Config
) -> Result<(), CommandError> {
    let mut current = store.config.lock().unwrap();
    *current = config;
    log::info!("Configuration saved");
    Ok(())
}

/// List available tools
#[tauri::command]
pub fn list_tools() -> Result<Vec<ToolDefinition>, CommandError> {
    Ok(vec![
        ToolDefinition {
            name: "read".to_string(),
            description: "Read contents of a file".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" }
                },
                "required": ["path"]
            })
        },
        ToolDefinition {
            name: "write".to_string(),
            description: "Write content to a file".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "content": { "type": "string" }
                },
                "required": ["path", "content"]
            })
        },
        ToolDefinition {
            name: "bash".to_string(),
            description: "Execute a bash/shell command".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "command": { "type": "string" },
                    "cwd": { "type": "string" }
                },
                "required": ["command"]
            })
        },
        ToolDefinition {
            name: "spawn".to_string(),
            description: "Spawn a sub-agent".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "prompt": { "type": "string" },
                    "model": { "type": "string" }
                },
                "required": ["prompt"]
            })
        },
        ToolDefinition {
            name: "council".to_string(),
            description: "Invoke AI Council".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "topic": { "type": "string" }
                },
                "required": ["topic"]
            })
        }
    ])
}

/// Invoke a tool directly
#[tauri::command]
pub fn invoke_tool(
    name: String,
    args: serde_json::Value
) -> Result<serde_json::Value, CommandError> {
    // Tool invocation would be handled by the TypeScript runtime
    // For now, return a placeholder
    log::info!("Tool invocation: {} with args {:?}", name, args);
    Ok(serde_json::json!({
        "success": true,
        "tool": name,
        "result": "Tool execution placeholder"
    }))
}

// ============ Helper Functions ============

fn generate_id() -> String {
    format!("{}-{}", now_millis(), random_string(8))
}

fn now_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

fn random_string(len: usize) -> String {
    use std::iter;
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    iter::repeat_with(|| {
        let idx = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos() as usize;
        CHARSET[idx % CHARSET.len()] as char
    })
    .take(len)
    .collect()
}