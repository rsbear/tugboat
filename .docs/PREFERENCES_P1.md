# Preferences implementation task (phase 1)

### High level user stories:
- I can type prefs into the input and the app displays configuration in monaco without submitting the form
- The language used for configuration is TOML
- I can click a 'Save' button and TOML is converted to JSON
- On save, preferences are saved to the application SQLITE KV

### Libraries used (already installed):
- modern-monaco
- smol-toml
- @tugboats/core (aka pkgs/core)

### Code requirements:
- Preferences lives in own file, the_preferences.js
- It should be callable by the_input.js via a single exposed function
