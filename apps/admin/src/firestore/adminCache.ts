import { getFirestore, doc, getDoc, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from '../../firebase.js';

export const ADMIN_CACHE_TTL_SECONDS = 600;

export const ADMIN_CACHE_DOCS = {
  customers: 'admin_customers',
  kycQueue: 'admin_kyc_queue',
  policies: 'admin_policies',
  payments: 'admin_payments',
} as const;

type CacheDoc = {
  payloadJson?: string;
  cachedAtEpochSeconds?: number;
};

let db: Firestore | null = null;

function configured(): boolean {
  return import.meta.env.VITE_FIRESTORE_CACHE !== 'false';
}

function firestore(): Firestore | null {
  if (!configured()) return null;
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

function isFresh(cachedAtEpochSeconds: number, ttlSeconds: number): boolean {
  const age = Math.floor(Date.now() / 1000) - cachedAtEpochSeconds;
  return age >= 0 && age < ttlSeconds;
}

export async function readAdminCache<T>(
  docId: string,
  ttlSeconds = ADMIN_CACHE_TTL_SECONDS,
): Promise<{ data: T; cachedAt: number } | null> {
  const fs = firestore();
  if (!fs) return null;
  try {
    const snap = await getDoc(doc(fs, 'gcul_cache', docId));
    if (!snap.exists()) return null;
    const raw = snap.data() as CacheDoc;
    const cachedAt = raw.cachedAtEpochSeconds;
    if (cachedAt == null || !isFresh(cachedAt, ttlSeconds) || !raw.payloadJson) {
      return null;
    }
    return { data: JSON.parse(raw.payloadJson) as T, cachedAt };
  } catch {
    return null;
  }
}

export async function loadWithAdminCache<T>(
  docId: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean; ttlSeconds?: number },
): Promise<{ data: T; fromCache: boolean; cachedAt?: number }> {
  const ttlSeconds = options?.ttlSeconds ?? ADMIN_CACHE_TTL_SECONDS;
  if (!options?.force) {
    const cached = await readAdminCache<T>(docId, ttlSeconds);
    if (cached) {
      return { data: cached.data, fromCache: true, cachedAt: cached.cachedAt };
    }
  }
  const data = await fetcher();
  return { data, fromCache: false };
}

export function formatCacheAge(cachedAt?: number): string | null {
  if (!cachedAt) return null;
  const ageSec = Math.max(0, Math.floor(Date.now() / 1000) - cachedAt);
  if (ageSec < 60) return 'just now';
  const mins = Math.floor(ageSec / 60);
  return `${mins}m ago`;
}
