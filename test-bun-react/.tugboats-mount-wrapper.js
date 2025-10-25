
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from './app.tsx';

export function mountComponent(slot) {
  const root = createRoot(slot);
  root.render(createElement(App));
  return () => root.unmount();
}

// Also export default for new pattern
export default App;
