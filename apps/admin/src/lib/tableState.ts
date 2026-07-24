import { useEffect, useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export type SortValue = string | number | boolean | null | undefined;

export function compareSortValues(a: SortValue, b: SortValue, dir: SortDir): number {
  const empty = (v: SortValue) => v === null || v === undefined || v === '';
  if (empty(a) && empty(b)) return 0;
  if (empty(a)) return 1;
  if (empty(b)) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return dir === 'asc' ? a - b : b - a;
  }

  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  const cmp = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

export function sortItems<T>(
  items: T[],
  sortKey: string,
  sortDir: SortDir,
  getSortValue?: (item: T, key: string) => SortValue,
): T[] {
  if (!sortKey) return [...items];
  const read = getSortValue ?? ((item: T, key: string) => (item as Record<string, SortValue>)[key]);
  return [...items].sort((a, b) => compareSortValues(read(a, sortKey), read(b, sortKey), sortDir));
}

export type UseTableStateOptions<T> = {
  pageSize?: number;
  defaultSortKey?: string;
  defaultSortDir?: SortDir;
  getSortValue?: (item: T, key: string) => SortValue;
};

export function useTableState<T>(items: T[], options: UseTableStateOptions<T> = {}) {
  const {
    pageSize: initialPageSize = 10,
    defaultSortKey = '',
    defaultSortDir = 'asc',
    getSortValue,
  } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize, sortKey, sortDir]);

  const sorted = useMemo(
    () => sortItems(items, sortKey, sortDir, getSortValue),
    [items, sortKey, sortDir, getSortValue],
  );

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function setSort(key: string, dir: SortDir) {
    setSortKey(key);
    setSortDir(dir);
  }

  return {
    pageItems,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    sortKey,
    sortDir,
    toggleSort,
    setSort,
  };
}
