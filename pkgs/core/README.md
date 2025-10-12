# @tugboats/core

The core SDK for Tugboats - a host/runtime for pluggable web applications. This package provides a singleton reactive input store and namespaced key-value storage APIs designed to work seamlessly within the Tugboats ecosystem.

## Features

- **Reactive Input Store**: A singleton store for managing and reacting to user input across all tugboat applications
- **Namespaced KV Storage**: Isolated key-value storage with SQLite persistence via Tauri backend
- **Framework Agnostic**: Works with React, Svelte, or any JavaScript framework
- **TypeScript Support**: Full type safety with comprehensive TypeScript definitions

## Installation

```bash
npm install @tugboats/core
```

**Important**: This package is designed to be used as a **peer dependency** in tugboat applications. The host application provides the singleton runtime via import maps to ensure state consistency.

## Architecture

The core SDK follows a **singleton architecture** to prevent version conflicts and maintain state consistency across multiple tugboat applications. The host application serves the actual runtime ESM module, while applications only install this package for TypeScript definitions.

### Key Principles
- Never bundle `@tugboats/core` inside tugboat apps - always externalize it
- Consume core via host import map for singleton behavior
- Runtime vs Dev: Use `npm install @tugboats/core` for types only

## API Reference

### Input Store

The input store provides reactive state management for user input across all tugboat applications.

```typescript
import { input } from '@tugboats/core';

// Get current input state
const currentState = input.get();
console.log(currentState.raw); // Current input string

// Set input (triggers all subscribers)
input.set('new input value');

// Subscribe to input changes
const unsubscribe = input.subscribe((state) => {
  console.log('Input changed:', state.raw);
});

// Cleanup subscription
unsubscribe();
```

#### InputState Type
```typescript
type InputState = {
  raw: string;
};
```

### KV Storage

The KV storage system provides namespaced key-value storage with SQLite persistence.

```typescript
import { kvTable } from '@tugboats/core';

// Create a namespaced KV table
const appStorage = kvTable<any>('MyApp');

// List all items in namespace
const listResult = await appStorage.list();
if (listResult._tag === 'Ok') {
  console.log('Items:', listResult.result);
}

// Get a specific item
const getResult = await appStorage.get(['settings', 'theme']);
if (getResult._tag === 'Ok') {
  console.log('Theme:', getResult.result.value);
}

// Set a value
await appStorage.set(['settings', 'theme'], 'dark');

// Delete a value
await appStorage.delete(['settings', 'theme']);
```

#### KV Types
```typescript
interface KvItem<T> {
  value: T;
  metadata: {
    key: string[];
    created_at: number;
    updated_at: number;
  };
}

type KvMsg<T> =
  | { _tag: "None"; result: null }
  | { _tag: "Error"; result: string }
  | { _tag: "Ok"; _type: "List"; result: KvItem<T>[] }
  | { _tag: "Ok"; _type: "Item"; result: KvItem<T> }
  | { _tag: "Ok"; _type: "String"; result: string };

interface KvTable<T> {
  list(): Promise<KvMsg<T>>;
  get(key: string[]): Promise<KvMsg<T>>;
  set(key: string[], value: T): Promise<KvMsg<T>>;
  delete(key: string[]): Promise<KvMsg<void>>;
}
```

## Usage in Tugboat Apps

### React Example
```typescript
import { input, kvTable } from '@tugboats/core';
import { useEffect, useState } from 'react';

function MyTugboatApp() {
  const [inputState, setInputState] = useState(input.get());
  const storage = kvTable<any>('MyApp');

  useEffect(() => {
    const unsubscribe = input.subscribe(setInputState);
    return unsubscribe;
  }, []);

  const handleSave = async () => {
    await storage.set(['user', 'input'], inputState.raw);
  };

  return (
    <div>
      <p>Current input: {inputState.raw}</p>
      <button onClick={handleSave}>Save Input</button>
    </div>
  );
}
```

### Svelte Example
```typescript
import { input, kvTable } from '@tugboats/core';
import { onMount, onDestroy } from 'svelte';

let inputState = input.get();
let unsubscribe: () => boolean;
const storage = kvTable<any>('MyApp');

onMount(() => {
  unsubscribe = input.subscribe((state) => {
    inputState = state;
  });
});

onDestroy(() => {
  unsubscribe?.();
});

async function handleSave() {
  await storage.set(['user', 'input'], inputState.raw);
}
```

## Bundler Configuration

When creating tugboat applications, ensure your bundler externalizes this package:

### Vite Configuration
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      external: ['@tugboats/core']
    }
  }
};
```

### Webpack Configuration
```javascript
// webpack.config.js
module.exports = {
  externals: {
    '@tugboats/core': '@tugboats/core'
  }
};
```

## Requirements

- **Runtime Environment**: Tauri application with tugboat host
- **Node.js**: >= 18.0.0 (for development)
- **Browser**: Modern browsers with ES2020 support

## Integration with Tugboat Host

This package is designed to work within the Tugboats host environment, which provides:
- Tauri backend with KV storage commands
- Import map configuration for singleton behavior
- Input state management and distribution

## Error Handling

All KV operations return a tagged union type for explicit error handling:

```typescript
const result = await storage.get(['some', 'key']);

switch (result._tag) {
  case 'Ok':
    console.log('Success:', result.result);
    break;
  case 'Error':
    console.error('Error:', result.result);
    break;
  case 'None':
    console.log('No value found');
    break;
}
```

## Contributing

This package is part of the Tugboats monorepo. See the main repository for contribution guidelines.

## License

Licensed under either of:
- MIT License
- Apache License, Version 2.0

at your option.