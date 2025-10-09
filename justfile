# Build the core package
build_core:
    cd pkgs/core && deno task build

# Run the development server
dev:
    cd pkgs/core && deno task build
    cd app && deno task tauri dev

check_cargo:
    cargo check --manifest-path /app/src-tauri/Cargo.toml
