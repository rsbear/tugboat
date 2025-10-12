# Build the core package
build_core:
    cd pkgs/core && bun run build

# Build core and copy to app assets for development
build_core_dev:
    cd pkgs/core && bun run build
    mkdir -p app/src/assets/core
    cp pkgs/core/dist/* app/src/assets/core/

# Run the development server
dev:
    just build_core_dev
    cd app && bun tauri dev

check_cargo:
    cd app/src-tauri && cargo check

publish_core:
    cd pkgs/core && bun publish --access public
