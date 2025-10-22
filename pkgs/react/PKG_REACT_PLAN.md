# pkgs/react Implementation Plan

## Overview

Create `@tugboats/react` package that wraps `@tugboats/core` with React hooks for ergonomic consumption in React-based tugboat apps.

## Package Architecture

### Dependencies
- **peerDependencies**: `react@^18.0.0 || ^19.0.0`, `@tugboats/core@^0.0.11`
- **devDependencies**: `typescript`, `tsup`, `@types/react`

### Build Configuration
- **Bundler**: `tsup` (matching core package pattern)
- **Externalize**: Both `react` and `@tugboats/core` (peer dependencies)
- **Output**: Single ESM file with TypeScript declarations

## Hook Implementations

### 1. `useTugboatsInput()`

Returns reactive input state that automatically subscribes/unsubscribes to the core input store.

```typescript
// pkgs/react/src/useTugboatsInput.ts
import { useEffect, useState } from 'react';
import { input, type InputStateAndParts } from '@tugboats/core';

export function useTugboatsInput(): InputStateAndParts {
  const [state, setState] = useState<InputStateAndParts>(() => input.get());

  useEffect(() => {
    const unsubscribe = input.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return state;
}
```

**Features**:
- Automatic subscription management (cleanup on unmount)
- Initial state from `input.get()` to avoid flash of empty state
- Returns full `InputStateAndParts` object with `raw`, `alias`, `query`

### 2. `useKV<T>(namespace: string)`

Returns KV table interface with namespace isolation.

```typescript
// pkgs/react/src/useKV.ts
import { useMemo } from 'react';
import { kvTable, type KvTable } from '@tugboats/core';

export function useKV<T = unknown>(namespace: string): KvTable<T> {
  const table = useMemo(() => kvTable<T>(namespace), [namespace]);
  return table;
}
```

**Features**:
- Memoized to prevent recreation on every render
- Generic type parameter for type-safe value handling
- Direct passthrough to core `KvTable` interface

**Optional Enhancement** (future iteration):
```typescript
// Reactive variant with automatic state synchronization
export function useKVState<T>(
  namespace: string,
  key: string[]
): [T | null, (value: T) => Promise<void>, boolean] {
  // Returns [value, setValue, loading]
  // Auto-fetches on mount and provides setter
}
```

## File Structure

```
pkgs/react/
├── src/
│   ├── useTugboatsInput.ts
│   ├── useKV.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## NPM Distribution Plan

### package.json Configuration

```json
{
  "name": "@tugboats/react",
  "version": "0.0.1",
  "description": "React hooks for Tugboats core SDK",
  "license": "(MIT OR Apache-2.0)",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist/**/*",
    "README.md"
  ],
  "scripts": {
    "build": "tsup"
  },
  "peerDependencies": {
    "@tugboats/core": "^0.0.11",
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "tsup": "^8.5.0",
    "typescript": "^5.9.2"
  },
  "keywords": [
    "tugboats",
    "react",
    "plugin"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/rsbear/tugboats",
    "directory": "pkgs/react"
  }
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', '@tugboats/core'],
  treeshake: true,
  sourcemap: true,
});
```

### Publishing Strategy

1. **Local Development**:
   ```bash
   cd pkgs/react && npm run build
   npm link  # For local testing
   ```

2. **NPM Publishing**:
   ```bash
   npm publish --access public
   ```

3. **Versioning**: Follow `@tugboats/core` major version for compatibility

## Example Usage in test_mini_react/

### Updated tugboats.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { useTugboatsInput, useKV } from "@tugboats/react";
import type { KvMsg } from "@tugboats/core";

function App() {
  const inputState = useTugboatsInput();
  const kv = useKV<string>("MiniReact");

  const [savedValue, setSavedValue] = React.useState<string | null>(null);

  // Load saved value on mount
  React.useEffect(() => {
    kv.get(["lastInput"]).then((msg: KvMsg<string>) => {
      if (msg._tag === "Ok" && msg._type === "Item") {
        setSavedValue(msg.result.value);
      }
    });
  }, []);

  // Save to KV when input changes
  const handleSave = async () => {
    await kv.set(["lastInput"], inputState.raw);
    setSavedValue(inputState.raw);
  };

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <h1 className="text-2xl font-bold text-white mb-4">
        React Tugboat Example
      </h1>

      <div className="space-y-4">
        <div>
          <label className="text-gray-300 block mb-2">Current Input:</label>
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-white">Raw: {inputState.raw}</div>
            <div className="text-gray-400">Alias: {inputState.alias}</div>
            <div className="text-gray-400">Query: {inputState.query}</div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Save to KV Store
        </button>

        {savedValue && (
          <div className="bg-green-900/30 p-3 rounded">
            <div className="text-green-300">
              Last saved: {savedValue}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function tugboatReact(targetElement: HTMLElement) {
  const root = ReactDOM.createRoot(targetElement);
  root.render(<App />);
  return root;
}
```

### Updated package.json

```json
{
  "name": "mini-react-ts",
  "version": "0.1.0",
  "dependencies": {
    "@tugboats/core": "^0.0.11",
    "@tugboats/react": "^0.0.1",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^5.0.4",
    "vite": "^7.1.10"
  }
}
```

### Vite Configuration (Required)

```typescript
// test_mini_react/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './tugboats.tsx',
      formats: ['es'],
      fileName: 'tugboat',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@tugboats/core', '@tugboats/react'],
    },
  },
});
```

## Implementation Checklist

- [ ] Create `pkgs/react/` directory structure
- [ ] Implement `useTugboatsInput` hook
- [ ] Implement `useKV` hook
- [ ] Configure `tsup` build
- [ ] Add TypeScript configuration
- [ ] Write package.json with peer dependencies
- [ ] Build and test locally with `npm link`
- [ ] Update `test_mini_react/tugboats.tsx` with hook examples
- [ ] Verify bundle externalization in Vite build
- [ ] Test singleton behavior (core not bundled twice)
- [ ] Publish to NPM with `@tugboats` scope
- [ ] Update `justfile` with React build command (optional)

## Testing Strategy

1. **Unit Tests** (future): Test hooks with React Testing Library
2. **Integration Test**: Run `test_mini_react` app in Tauri host
3. **Bundle Verification**: Inspect Vite output to ensure externalization
4. **Singleton Verification**: Console log core instance to verify single import

## Critical Success Criteria

✅ Hooks provide clean, idiomatic React API
✅ `@tugboats/core` remains externalized (not bundled)
✅ TypeScript types flow through correctly
✅ Works seamlessly with host import map system
✅ No React version conflicts (peer dependency strategy)
✅ Automatic cleanup prevents memory leaks
