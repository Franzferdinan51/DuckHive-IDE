//! DuckHive-IDE Tauri Backend
//!
//! The Rust backend that hosts the TypeScript AgentCore runtime
//! and provides IPC commands for the frontend.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use log::info;
use tauri::Manager;

fn main() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp_millis()
        .init();

    info!("Starting DuckHive-IDE v{}", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            info!("Tauri app setup complete");

            // Log the data directory
            if let Some(data_dir) = app.path().app_data_dir().ok() {
                info!("App data directory: {:?}", data_dir);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_session,
            commands::get_session,
            commands::send_message,
            commands::list_sessions,
            commands::get_config,
            commands::save_config,
            commands::list_tools,
            commands::invoke_tool
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}