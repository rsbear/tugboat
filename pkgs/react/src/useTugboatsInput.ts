import { useEffect, useState } from 'react';
import { input, type InputStateAndParts } from '@tugboats/core';

export function useTugboatsInput(): InputStateAndParts {
  const [state, setState] = useState<InputStateAndParts>(() => input.get());

  useEffect(() => {
    const unsubscribe = input.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}