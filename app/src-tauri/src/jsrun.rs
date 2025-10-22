//! JavaScript Runtime Abstraction Layer
//!
//! Provides unified interface for npm, deno, and bun package managers and build tools.
//! This module abstracts away runtime-specific command construction and provides
//! consistent error handling across different JavaScript runtimes.
//!
//! # Example Usage
//!
//! ```rust
//! use jsrun::{JSRuntime, detect_runtime};
//!
//! // Auto-detect from lockfiles
//! let runtime = detect_runtime(&project_dir);
//!
//! // Or explicitly choose
//! let runtime = JSRuntime::Npm;
//!
//! // Ensure runtime is available
//! runtime.ensure_available().await?;
//!
//! // Install dependencies
//! runtime.install(&project_dir).await?;
//!
//! // Install dev dependencies
//! runtime.install_dev(&["vite", "@vitejs/plugin-react"], &project_dir).await?;
//!
//! // Run build
//! runtime.build(&["vite", "build", "--config", "vite.config.mjs"], &project_dir).await?;
//! ```
//!
//! # Extensibility
//!
//! To add support for new runtimes (e.g., yarn, pnpm):
//!
//! 1. Add new variant to `JSRuntime` enum:
//!    ```rust
//!    pub enum JSRuntime {
//!        Npm,
//!        Deno,
//!        Bun,
//!        Yarn,  // New!
//!    }
//!    ```
//!
//! 2. Update `as_str()`, `binary()`, and `executor()` methods
//!
//! 3. Add lockfile detection in `detect_runtime()`:
//!    ```rust
//!    if project_dir.join("yarn.lock").exists() {
//!        return JSRuntime::Yarn;
//!    }
//!    ```
//!
//! 4. Implement runtime-specific command logic in:
//!    - `ensure_tools_available()` if additional tools needed
//!    - `install()` for dependency installation
//!    - `install_dev()` for dev dependency installation
//!    - `build()` for build command execution
//!
//! 5. Add installation instructions in `ensure_available()` error messages
//!
//! The current design keeps runtime logic centralized, making it straightforward
//! to add new runtimes without touching consumer code (bundler.rs, devserver.rs).

use std::path::Path;
use tokio::process::Command;

/// Supported JavaScript runtimes/package managers
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JSRuntime {
    /// Node.js with npm (default)
    Npm,
    /// Deno runtime
    Deno,
    /// Bun runtime
    Bun,
}

impl JSRuntime {
    /// Returns the string identifier for this runtime
    pub fn as_str(&self) -> &'static str {
        match self {
            JSRuntime::Npm => "npm",
            JSRuntime::Deno => "deno",
            JSRuntime::Bun => "bun",
        }
    }

    /// Returns the primary binary name for this runtime
    pub fn binary(&self) -> &'static str {
        match self {
            JSRuntime::Npm => "npm",
            JSRuntime::Deno => "deno",
            JSRuntime::Bun => "bun",
        }
    }

    /// Returns the execution wrapper binary (npx, deno run, bunx)
    pub fn executor(&self) -> &'static str {
        match self {
            JSRuntime::Npm => "npx",
            JSRuntime::Deno => "deno",
            JSRuntime::Bun => "bunx",
        }
    }

    /// Verifies that the runtime is installed and available
    ///
    /// # Errors
    ///
    /// Returns descriptive error with installation instructions if tool is not available
    pub async fn ensure_available(&self) -> Result<(), String> {
        let bin = self.binary();
        let result = Command::new(bin)
            .arg("--version")
            .output()
            .await;

        match result {
            Ok(output) if output.status.success() => Ok(()),
            Ok(_) => Err(format!(
                "❌ {} returned non-zero status. Please reinstall {}.",
                bin,
                self.as_str()
            )),
            Err(_) => {
                let install_hint = match self {
                    JSRuntime::Npm => "Install Node.js from https://nodejs.org",
                    JSRuntime::Deno => "Install Deno from https://deno.land",
                    JSRuntime::Bun => "Install Bun from https://bun.sh",
                };
                Err(format!(
                    "❌ {} is not installed or not available in PATH.\n{}",
                    bin, install_hint
                ))
            }
        }
    }

    /// Ensures additional tools required by this runtime are available
    ///
    /// For npm, also checks for npx. For other runtimes, only checks the main binary.
    pub async fn ensure_tools_available(&self) -> Result<(), String> {
        // Check primary binary
        self.ensure_available().await?;

        // Check additional tools
        match self {
            JSRuntime::Npm => {
                // Verify npx is available
                Command::new("npx")
                    .arg("--version")
                    .output()
                    .await
                    .map_err(|_| {
                        "❌ npx is not available. Please reinstall Node.js.".to_string()
                    })?;

                // Verify node itself
                Command::new("node")
                    .arg("--version")
                    .output()
                    .await
                    .map_err(|_| {
                        "❌ node is not available. Please install Node.js from https://nodejs.org"
                            .to_string()
                    })?;
            }
            JSRuntime::Deno | JSRuntime::Bun => {
                // No additional tools needed
            }
        }

        Ok(())
    }

    /// Install project dependencies
    ///
    /// Checks for node_modules existence and skips if present to avoid unnecessary churn.
    ///
    /// # Arguments
    ///
    /// * `project_dir` - Directory containing package.json (or deno.json for Deno)
    pub async fn install(&self, project_dir: &Path) -> Result<(), String> {
        // Skip if node_modules already exists (optimization for rebuilds)
        let node_modules = project_dir.join("node_modules");
        if node_modules.exists() {
            return Ok(());
        }

        match self {
            JSRuntime::Npm => {
                self.run_command("npm", &["install"], Some(project_dir))
                    .await
            }
            JSRuntime::Deno => {
                // Deno doesn't need explicit install in most cases
                Ok(())
            }
            JSRuntime::Bun => {
                self.run_command("bun", &["install"], Some(project_dir))
                    .await
            }
        }
    }

    /// Install development dependencies
    ///
    /// # Arguments
    ///
    /// * `packages` - Array of package names to install
    /// * `project_dir` - Directory containing package.json
    pub async fn install_dev(&self, packages: &[&str], project_dir: &Path) -> Result<(), String> {
        if packages.is_empty() {
            return Ok(());
        }

        match self {
            JSRuntime::Npm => {
                let mut args = vec!["install", "-D"];
                args.extend_from_slice(packages);
                self.run_command("npm", &args, Some(project_dir)).await
            }
            JSRuntime::Deno => {
                // Deno uses import maps, no install needed
                Ok(())
            }
            JSRuntime::Bun => {
                let mut args = vec!["add", "-d"];
                args.extend_from_slice(packages);
                self.run_command("bun", &args, Some(project_dir)).await
            }
        }
    }

    /// Execute a build command using the appropriate tool executor
    ///
    /// # Arguments
    ///
    /// * `args` - Command arguments (e.g., ["vite", "build", "--config", "vite.config.mjs"])
    /// * `project_dir` - Working directory for the command
    ///
    /// # Example
    ///
    /// ```rust
    /// runtime.build(&["vite", "build"], &project_dir).await?;
    /// ```
    pub async fn build(&self, args: &[&str], project_dir: &Path) -> Result<(), String> {
        match self {
            JSRuntime::Npm => {
                // npx --yes <args>
                let mut full_args = vec!["--yes"];
                full_args.extend_from_slice(args);
                self.run_command("npx", &full_args, Some(project_dir)).await
            }
            JSRuntime::Deno => {
                // deno run --allow-all npm:vite <args[1..]>
                if args.is_empty() {
                    return Err("No build tool specified for deno".to_string());
                }
                let tool = format!("npm:{}", args[0]);
                let mut full_args = vec!["run", "--allow-all", &tool];
                full_args.extend_from_slice(&args[1..]);
                self.run_command("deno", &full_args, Some(project_dir)).await
            }
            JSRuntime::Bun => {
                // bunx <args>
                self.run_command("bunx", args, Some(project_dir)).await
            }
        }
    }

    /// Low-level command execution helper
    ///
    /// Runs a command and returns error if it fails
    async fn run_command(
        &self,
        bin: &str,
        args: &[&str],
        cwd: Option<&Path>,
    ) -> Result<(), String> {
        let mut cmd = Command::new(bin);
        cmd.args(args);
        if let Some(dir) = cwd {
            cmd.current_dir(dir);
        }

        let status = cmd
            .status()
            .await
            .map_err(|e| format!("Failed to run '{} {}': {}", bin, args.join(" "), e))?;

        if !status.success() {
            return Err(format!(
                "Command failed ({} {}): {:?}",
                bin,
                args.join(" "),
                status.code()
            ));
        }

        Ok(())
    }

    /// Run command and capture output (for build commands that might fail)
    ///
    /// Returns stdout and stderr for error reporting
    pub async fn run_command_with_output(
        &self,
        bin: &str,
        args: &[&str],
        cwd: Option<&Path>,
    ) -> Result<std::process::Output, String> {
        let mut cmd = Command::new(bin);
        cmd.args(args);
        if let Some(dir) = cwd {
            cmd.current_dir(dir);
        }

        cmd.output()
            .await
            .map_err(|e| format!("Failed to run '{} {}': {}", bin, args.join(" "), e))
    }
}

/// Auto-detect JavaScript runtime from project directory
///
/// Looks for lockfiles in this order:
/// 1. package-lock.json → Npm
/// 2. bun.lock → Bun
/// 3. deno.lock → Deno
/// 4. Default to Npm if none found
///
/// # Arguments
///
/// * `project_dir` - Directory to scan for lockfiles
pub fn detect_runtime(project_dir: &Path) -> JSRuntime {
    if project_dir.join("package-lock.json").exists() {
        JSRuntime::Npm
    } else if project_dir.join("bun.lock").exists() {
        JSRuntime::Bun
    } else if project_dir.join("deno.lock").exists() {
        JSRuntime::Deno
    } else {
        // Default fallback
        JSRuntime::Npm
    }
}

/// Pick runtime explicitly or auto-detect if None
///
/// Convenience function for optional runtime selection
pub fn pick_runtime(explicit: Option<JSRuntime>, project_dir: &Path) -> JSRuntime {
    explicit.unwrap_or_else(|| detect_runtime(project_dir))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runtime_strings() {
        assert_eq!(JSRuntime::Npm.as_str(), "npm");
        assert_eq!(JSRuntime::Deno.as_str(), "deno");
        assert_eq!(JSRuntime::Bun.as_str(), "bun");
    }

    #[test]
    fn test_runtime_binaries() {
        assert_eq!(JSRuntime::Npm.binary(), "npm");
        assert_eq!(JSRuntime::Npm.executor(), "npx");
        assert_eq!(JSRuntime::Deno.binary(), "deno");
        assert_eq!(JSRuntime::Deno.executor(), "deno");
        assert_eq!(JSRuntime::Bun.binary(), "bun");
        assert_eq!(JSRuntime::Bun.executor(), "bunx");
    }
}
