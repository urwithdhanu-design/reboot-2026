import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, type Firestore } from "firebase/firestore";
import type { Product } from "../api";

const DEFAULT_CATEGORIES = [
  "All",
  "Health",
  "Vehicle",
  "Pet",
  "Property",
  "Life",
  "Travel",
];

type CatalogDoc = {
  plansJson?: string;
  cachedAtEpochSeconds?: number;
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function configured(): boolean {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  return import.meta.env.VITE_FIRESTORE_CACHE !== "false" && !!projectId && !!apiKey;
}

function firestore(): Firestore | null {
  if (!configured()) return null;
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    db = getFirestore(app);
  }
  return db;
}

/** Map cached InsurancePlan JSON (camelCase from Java) to API Product shape. */
function planToProduct(raw: Record<string, unknown>): Product {
  const bullets = raw.bulletsJson;
  let parsedBullets: string[] | undefined;
  if (typeof bullets === "string" && bullets.startsWith("[")) {
    try {
      parsedBullets = JSON.parse(bullets) as string[];
    } catch {
      parsedBullets = undefined;
    }
  }
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    tagline: raw.tagline != null ? String(raw.tagline) : undefined,
    bullets: parsedBullets,
    cta_label: raw.ctaLabel != null ? String(raw.ctaLabel) : String(raw.title ?? ""),
    category: String(raw.category ?? ""),
    price_from: Number(raw.priceFrom ?? 0),
    price_unit: String(raw.priceUnit ?? "month"),
    currency: String(raw.currency ?? "GBP"),
    rating: Number(raw.rating ?? 0),
    review_count: Number(raw.reviewCount ?? 0),
    best_seller: Boolean(raw.bestSeller),
    icon: String(raw.icon ?? "shield"),
  };
}

export async function loadMarketplaceFromFirestore(): Promise<{
  categories: string[];
  products: Product[];
} | null> {
  const fs = firestore();
  if (!fs) return null;
  try {
    const snap = await getDoc(doc(fs, "gcul_cache", "policy_marketplace"));
    if (!snap.exists()) return null;
    const data = snap.data() as CatalogDoc;
    if (!data.plansJson) return null;
    const plans = JSON.parse(data.plansJson) as Record<string, unknown>[];
    const products = plans.map(planToProduct);
    return { categories: DEFAULT_CATEGORIES, products };
  } catch {
    return null;
  }
}
