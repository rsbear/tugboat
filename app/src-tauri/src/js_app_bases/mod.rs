//! JavaScript App Bases - Pluggable build system for different app types
//!
//! This module provides a trait-based abstraction for handling different types of
//! tugboat apps (npm+Vite, Deno+Vite, Gleam/Lustre, Elm, etc.) without code duplication.
//!
//! # Architecture
//!
//! - `AppBase` trait: Core interface that all app types implement
//! - `BuildContext`: Shared state passed between build phases
//! - Concrete implementations: NpmViteAppBase, DenoViteAppBase, etc.
//! - Utilities: Shared helper functions
//!
//! See JS_APP_BASES.md for full design documentation.

pub mod npm_vite;
pub mod utils;

use std::path::PathBuf;

/// Shared context passed through build phases
#[derive(Debug, Clone)]
pub struct BuildContext {
    /// Project directory containing source files and config
    pub project_dir: PathBuf,
    /// App alias for bundle naming
    pub alias: String,
    /// Relative path to entry file (e.g., "src/app.tsx")
    pub entry_rel: String,
    /// Framework identifier (e.g., "react", "svelte", "lustre")
    pub framework: String,
    /// Output bundle filename
    pub bundle_file: String,
    /// Temporary files created during build (for cleanup)
    pub temp_files: Vec<PathBuf>,
    /// Whether this is a dev build (affects naming and watching)
    pub is_dev: bool,
}

use std::future::Future;
use std::pin::Pin;

/// Core trait for tugboat app types
///
/// Implementations handle detection, validation, building, and artifact generation
/// for specific combinations of runtime + framework + build tool.
pub trait AppBase: Send + Sync {
    /// Detect if this handler can process the given directory
    ///
    /// Returns Some(Self) if it recognizes the project structure, None otherwise.
    /// Detection should be fast and only check for marker files (package.json, deno.json, etc.)
    fn detect(project_dir: &Path) -> Option<Box<dyn AppBase>>
    where
        Self: Sized;

    /// Validate that required tools are available
    ///
    /// Checks for runtime binaries, build tools, etc. Returns error with installation
    /// instructions if anything is missing.
    fn validate(&self) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + '_>>;

    /// Resolve the app entry point
    ///
    /// Searches for app entry file using framework-specific patterns.
    /// Returns relative path from project_dir.
    fn resolve_entry(&self) -> Result<String, String>;

    /// Get framework identifier
    ///
    /// Returns lowercase framework name: "react", "svelte", "lustre", etc.
    fn get_framework(&self) -> String;

    /// Prepare build context
    ///
    /// Creates temporary files (mount wrapper, vite config, etc.) and returns
    /// BuildContext with all necessary information for the build phase.
    fn prepare_build(
        &self,
        alias: &str,
        is_dev: bool,
    ) -> Pin<Box<dyn Future<Output = Result<BuildContext, String>> + Send + '_>>;

    /// Execute the build
    ///
    /// Runs the build tool (vite, deno bundle, gleam build, etc.) and produces
    /// the bundle in the expected location.
    fn build(
        &self,
        ctx: &BuildContext,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + '_>>;

    /// Generate import map for runtime
    ///
    /// Returns JSON import map for framework dependencies and @tugboats/core
    fn generate_importmap(&self) -> serde_json::Value;

    /// Generate mount utilities
    ///
    /// Returns JavaScript code for framework-specific mounting logic
    fn generate_mount_utils(&self) -> String;

    /// Cleanup temporary files
    ///
    /// Removes temp files created during prepare_build
    fn cleanup(
        &self,
        ctx: &BuildContext,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + '_>>;
}

use std::path::Path;

/// Detect which app base can handle a project directory
///
/// Tries each app base implementation in priority order and returns
/// the first one that claims it can handle the project.
///
/// # Priority Order
///
/// 1. NpmViteAppBase - package.json + Vite (most common)
/// 2. (Future) DenoViteAppBase - deno.json + Vite
/// 3. (Future) DenoBundleAppBase - deno.json + deno bundle
/// 4. (Future) GleamLustreAppBase - gleam.toml
/// 5. (Future) ElmAppBase - elm.json
///
/// # Errors
///
/// Returns error if no compatible app base is found
pub fn detect_app_base(project_dir: &Path) -> Result<Box<dyn AppBase>, String> {
    // Try npm/Vite first (most common case)
    if let Some(base) = npm_vite::NpmViteAppBase::detect(project_dir) {
        return Ok(base);
    }

    // Future: Try other app bases here
    // if let Some(base) = deno_vite::DenoViteAppBase::detect(project_dir) {
    //     return Ok(base);
    // }

    Err(format!(
        "No compatible app base found for project at {}. \
         Expected package.json with React/Svelte/etc. dependencies.",
        project_dir.display()
    ))
}
