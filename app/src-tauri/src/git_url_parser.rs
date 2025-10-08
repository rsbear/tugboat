//! Git URL parser for GitHub-style HTTPS URLs.
//!
//! This is an initial, minimal implementation guided by PREFERENCES_GITURLS.md.
//! It focuses on parsing URLs like:
//!   - https://github.com/owner/repo
//!   - https://github.com/owner/repo/
//!   - https://github.com/owner/repo.git
//!   - https://github.com/owner/repo/tree/branch
//!   - https://github.com/owner/repo/tree/branch/subdir
//!
//! Notes:
//! - We intentionally keep this simple for now; we can expand validations and types later.
//! - Tugboat apps are at most one level deep from repo root, but subpath can be any string.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitUrl {
    /// Original URL input (as provided)
    original: String,
    /// Repository owner/org (e.g., "rsbear")
    owner: String,
    /// Repository name without the .git suffix (e.g., "deleteme")
    repo: String,
    /// Optional branch from `/tree/<branch>`
    branch: Option<String>,
    /// Optional subpath after the branch (e.g., "mini-react-ts")
    subpath: Option<String>,
}

impl GitUrl {
    /// Parse a GitHub HTTPS URL into a GitUrl struct.
    ///
    /// Supported examples:
    /// - https://github.com/owner/repo
    /// - https://github.com/owner/repo/
    /// - https://github.com/owner/repo.git
    /// - https://github.com/owner/repo/tree/main
    /// - https://github.com/owner/repo/tree/main/subdir
    pub fn parse_https(input: &str) -> Result<Self, String> {
        // Require HTTPS GitHub URL for now
        let without_prefix = input
            .strip_prefix("https://github.com/")
            .ok_or_else(|| "URL must start with https://github.com/".to_string())?;

        let mut parts: Vec<&str> = without_prefix.split('/').filter(|p| !p.is_empty()).collect();
        if parts.len() < 2 {
            return Err("Expected https://github.com/<owner>/<repo>[...rest]".to_string());
        }

        let owner = parts[0].to_string();
        let mut repo = parts[1].to_string();
        if let Some(stripped) = repo.strip_suffix(".git") {
            repo = stripped.to_string();
        }

        let mut branch: Option<String> = None;
        let mut subpath: Option<String> = None;

        // Handle /tree/<branch>[/<subpath>]
        if parts.len() >= 4 && parts[2] == "tree" {
            branch = Some(parts[3].to_string());
            if parts.len() > 4 {
                let sub = parts[4..].join("/");
                if !sub.is_empty() {
                    subpath = Some(sub);
                }
            }
        }

        Ok(GitUrl {
            original: input.to_string(),
            owner,
            repo,
            branch,
            subpath,
        })
    }

    /// The repo owner (e.g. "rsbear").
    pub fn owner(&self) -> &str { &self.owner }

    /// The repo name without .git (e.g. "deleteme").
    pub fn repo(&self) -> &str { &self.repo }

    /// The optional branch (from `/tree/<branch>`), if present.
    pub fn branch(&self) -> Option<&str> { self.branch.as_deref() }

    /// The optional subpath after the branch, if present.
    /// Example: "mini-react-ts" from https://github.com/owner/repo/tree/main/mini-react-ts
    pub fn subpath(&self) -> Option<&str> { self.subpath.as_deref() }

    /// The canonical HTTPS base repo URL (without trailing slash or .git)
    /// Example: https://github.com/owner/repo
    pub fn https_base_url(&self) -> String {
        format!("https://github.com/{}/{}", self.owner, self.repo)
    }

    /// The SSH URL for cloning.
    /// Example: git@github.com:owner/repo.git
    pub fn ssh_url(&self) -> String {
        format!("git@github.com:{}/{}.git", self.owner, self.repo)
    }
}