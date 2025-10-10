# Create an assessment and plan

Create an assessment and plan for running vite dev on a preferences clone subpath and rendering the dev server outputs in `app/src/index.html` div id="tugboats-slot"

Relevant files:
- `app/src/app_input.js`
- `app/src/app_preferences.js`
- `app/src-tauri/src/bundler.rs`

**NOTE:** bundler.rs is just an example of how we are using vite to bundle

Goal: auto start if the app input equals a <clone-alias>
Goal: auto stop if the app input does not equal a <clone-alias>
Goal: using rust, stdout, and events and listeners, pipe vite's stdout messages to frontend


Tangent goal: delete the `app/src-tauri/src/devmode.rs`
