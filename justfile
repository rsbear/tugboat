# Build the core package
build_core:
    cd pkgs/core && deno task build

# Build core and copy to app assets for development
build_core_dev:
    cd pkgs/core && deno task build
    mkdir -p app/src/assets/core
    cp pkgs/core/dist/* app/src/assets/core/

# Run the development server
dev:
    just build_core_dev
    cd app && deno task tauri dev

check_cargo:
    cd app/src-tauri && cargo check
