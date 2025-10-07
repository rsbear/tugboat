# Implementation Plan: Cloning Repositories on Save Preferences

When a user clicks **Save Preferences**, Tugboats should automatically ensure all repositories listed in the **`clones`** array of the preferences TOML are cloned locally. This feature will be implemented collaboratively between the **frontend** (JS/TypeScript) and **backend** (Rust via Tauri).

---

## 1. Requirements Recap
- ✅ Respect **existing git installation** (use system `git` CLI).
- ✅ Support **SSH or HTTPS**, based on user’s git config.
- ✅ If repo already exists, **do not clone again**.
- ✅ If `dir` property missing:
  - Clone into default `~/tugboat_apps/{alias}`.
- ✅ If `dir` property exists:
  - Clone into specified `dir` if not already present.
- ✅ **`~` must resolve to the user’s home directory**.
- ✅ Work is **backend‑heavy**: expose **one command** `clone_repo(github_url, dir_path)`.
- ✅ **Do not touch `apps` array** yet (future work).
- ✅ Stream `git clone` **stdout/stderr** to frontend via Tauri **channels / events**.

---

## 2. Frontend Responsibilities
- **Parse preferences TOML → JSON → `clones[]`.**
- On **Save Preferences**:
  1. Call KV save logic (already existing).
  2. Iterate over `clones[]`.
  3. For each clone:
     - Resolve `~` → home dir (can be deferred to backend for consistency).
     - Invoke backend command:

     ```ts
     await window.__TAURI__.core.invoke("clone_repo", {
       githubUrl: clone.github_url,
       dirPath: clone.dir ?? "~/tugboat_apps"
     });
     ```

- **Listen for cloning progress events**:
  - Backend will emit `tugboats://clone-progress` with git stdout lines.
  - UI can log/display real-time feedback in the preferences panel.

---

## 3. Backend Responsibilities (Rust / Tauri)
### 3.1 New Tauri Command: `clone_repo`
Signature:
```rust
#[tauri::command]
async fn clone_repo(github_url: String, dir_path: String, app: tauri::AppHandle) -> Result<(), String>
```

Behaviour:
1. **Resolve `~`** to `dirs::home_dir()`.
2. **Derive final target path**:
   - If `dir_path` ends with `/tugboat_apps`, append repo alias (or inferred repo name from URL).
   - Else clone directly into given directory.
3. **Check if already exists**:
   - If `.git` folder present → return immediately with success.
4. Run `git clone {github_url} {target_dir}` using `tokio::process::Command`.
5. Stream **stdout & stderr** line by line.
   - For each line, emit Tauri event:
     ```rust
     app.emit_all("tugboats://clone-progress", line)?;
     ```
6. Return success or error result.

---

### 3.2 Git Process Handling
- Use `tokio::process::Command` so it’s async and doesn’t block UI.
- Example snippet:

```rust
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};

async fn run_git_clone/github_url, target_dir, app: AppHandle) -> Result<(), String> {
    let mut cmd = Command::new("git")
        .arg("clone")
        .arg(&github_url)
        .arg(&target_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    if let Some(stdout) = cmd.stdout.take() {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.try_next().await {
            let _ = app.emit_all("tugboats://clone-progress", line);
        }
    }

    let status = cmd.wait().await.map_err(|e| e.to_string())?;
    if !status.success() {
        return Err(format!("Git clone failed with code {:?}", status.code()));
    }
    Ok(())
}
```

---

## 4. End‑to‑End Flow
1. User opens **Preferences editor** → modifies/clones list.
2. User clicks **Save Preferences**:
   - Preferences save to KV.
   - Frontend iterates `clones[]` → invokes `clone_repo`.
3. Backend:
   - Resolves paths.
   - If repo already cloned: short‑circuit success.
   - Else launches async `git clone` and streams output.
   - Emits `tugboats://clone-progress` for progress UI.
4. Frontend:
   - Displays log or real‑time feedback in preferences panel.
   - Cloning complete → UI updates state.

---

## 5. Future Considerations
- Parallel vs Sequential cloning:
  - MVP: clone **sequentially** to avoid overwhelming FS / network.
  - Later: make concurrent with task queue.
- Add **cancellation support** (kill git process).
- Add **auth error messaging** for private repo clone failures.
- Persist last clone timestamp in KV.
