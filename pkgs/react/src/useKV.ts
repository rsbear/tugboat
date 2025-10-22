import { useMemo } from 'react';
import { kvTable, type KvTable } from '@tugboats/core';

export function useKV<T = unknown>(namespace: string): KvTable<T> {
  const table = useMemo(() => kvTable<T>(namespace), [namespace]);
  return table;
}
