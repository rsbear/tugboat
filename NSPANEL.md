All code was copied and pasted from this repo:
https://github.com/ahkohd/tauri-macos-spotlight-example/tree/v2



### main.rs
```rust
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use tauri_nspanel::ManagerExt;
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

use crate::window::WebviewWindowExt;

mod command;
mod window;

pub const SPOTLIGHT_LABEL: &str = "main";

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![command::show, command::hide])
        .plugin(tauri_nspanel::init())
        .setup(move |app| {
            // Set activation policy to Prohibited to prevent
            // app icon in dock and focus stealing on first launch
            //
            // Alternative: use Accessory to allow app activation
            // but hide from dock, it will steal focus on first launch
            app.set_activation_policy(tauri::ActivationPolicy::Prohibited);

            Ok(())
        })
        // Register a global shortcut (⌘+K) to toggle the visibility of the spotlight panel
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut(Shortcut::new(Some(Modifiers::SUPER), Code::KeyK))
                .unwrap()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed
                        && shortcut.matches(Modifiers::SUPER, Code::KeyK)
                    {
                        let window = app.get_webview_window(SPOTLIGHT_LABEL).unwrap();

                        match app
                            .get_webview_panel(SPOTLIGHT_LABEL)
                            .or_else(|_| window.to_spotlight_panel())
                        {
                            Ok(panel) => {
                                if panel.is_visible() {
                                    panel.hide();
                                } else {
                                    window.center_at_cursor_monitor().unwrap();
                                    panel.show_and_make_key();
                                }
                            }
                            Err(e) => eprintln!("{:?}", e),
                        }
                    }
                })
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### window.rs
```rust
use tauri::{Manager, Window};
use tauri_nspanel::{Panel, PanelBuilder, WindowExt};

pub trait WebviewWindowExt {
    fn to_spotlight_panel(&self) -> Result<Panel, String>;
}

impl WebviewWindowExt for Window<tauri::Wry> {
    fn to_spotlight_panel(&self) -> Result<Panel, String> {
        let panel = PanelBuilder::new(self.app_handle(), self.label())
            .with_custom_label("Spotlight")
            .with_max_size(Some((500, 500)))
            .build()?;

        Ok(panel)
    }
}
```

### command.rs
```rust
    use tauri::{Manager, Runtime, WebviewWindow};
    use tauri_nspanel::{
        tauri_panel, CollectionBehavior, ManagerExt, PanelHandle, PanelLevel, StyleMask,
        WebviewWindowExt as WebviewPanelExt,
    };
    use thiserror::Error;

    use crate::SPOTLIGHT_LABEL;

    tauri_panel! {
        panel!(SpotlightPanel {
            config: {
                can_become_key_window: true,
                is_floating_panel: true,
            }
        })

        panel_event!(SpotlightPanelEventHandler {
            window_did_become_key(notification: &NSNotification) -> (),
            window_did_resign_key(notification: &NSNotification) -> (),
        })
    }

    type TauriError = tauri::Error;

    #[derive(Error, Debug)]
    enum Error {
        #[error("Unable to convert window to panel")]
        Panel,
        #[error("Unable to find panel: {0}")]
        PanelNotFound(String),
        #[error("Monitor with cursor not found")]
        MonitorNotFound,
    }

    pub trait WebviewWindowExt<R: Runtime> {
        fn to_spotlight_panel(&self) -> tauri::Result<PanelHandle<R>>;

        fn center_at_cursor_monitor(&self) -> tauri::Result<()>;
    }

    impl<R: Runtime> WebviewWindowExt<R> for WebviewWindow<R> {
        fn to_spotlight_panel(&self) -> tauri::Result<PanelHandle<R>> {
            // Convert window to panel
            let panel = self
                .to_panel::<SpotlightPanel<R>>()
                .map_err(|_| TauriError::Anyhow(Error::Panel.into()))?;

            // Set panel level
            panel.set_level(PanelLevel::Floating.value());

            panel.set_collection_behavior(
                CollectionBehavior::new()
                    // Makes panel appear alongside full screen apps
                    .full_screen_auxiliary()
                    // Panel follows active desktop space
                    .move_to_active_space()
                    .value(),
            );

            // Ensures the panel cannot activate the App
            panel.set_style_mask(StyleMask::empty().nonactivating_panel().into());

            // Setup event handler for panel events
            let handler = SpotlightPanelEventHandler::new();

            handler.window_did_become_key(|_| {
                println!("panel became key window");
            });

            let app_handle = self.app_handle().clone();

            handler.window_did_resign_key(move |_| {
                println!("panel resign key window");

                // Hide panel when it resigns key window status
                if let Ok(panel) = app_handle.get_webview_panel(SPOTLIGHT_LABEL) {
                    if panel.is_visible() {
                        panel.hide();
                    }
                }
            });

            panel.set_event_handler(Some(handler.as_ref()));

            Ok(panel)
        }

        fn center_at_cursor_monitor(&self) -> tauri::Result<()> {
            let monitor = monitor::get_monitor_with_cursor()
                .ok_or(TauriError::Anyhow(Error::MonitorNotFound.into()))?;

            let monitor_scale_factor = monitor.scale_factor();

            let monitor_size = monitor.size().to_logical::<f64>(monitor_scale_factor);

            let monitor_position = monitor.position().to_logical::<f64>(monitor_scale_factor);

            let panel = self
                .get_webview_panel(self.label())
                .map_err(|_| TauriError::Anyhow(Error::PanelNotFound(self.label().into()).into()))?;

            let panel = panel.as_panel();

            let panel_frame = panel.frame();

            let rect = NSRect {
                origin: NSPoint {
                    x: (monitor_position.x + (monitor_size.width / 2.0))
                        - (panel_frame.size.width / 2.0),
                    y: (monitor_position.y + (monitor_size.height / 2.0))
                        - (panel_frame.size.height / 2.0),
                },
                size: panel_frame.size,
            };

            panel.setFrame_display(rect, true);

            Ok(())
        }
    }

```

### command.rs
```rust
use tauri::AppHandle;
use tauri_nspanel::ManagerExt;

use crate::SPOTLIGHT_LABEL;

#[tauri::command]
pub fn show(app_handle: AppHandle) {
    let panel = app_handle.get_webview_panel(SPOTLIGHT_LABEL).unwrap();

    panel.show_and_make_key();
}

#[tauri::command]
pub fn hide(app_handle: AppHandle) {
    let panel = app_handle.get_webview_panel(SPOTLIGHT_LABEL).unwrap();

    if panel.is_visible() {
        panel.hide();
    }
}
```
