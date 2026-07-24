import { getFirestore, doc, getDoc, type Firestore } from "firebase/firestore";
import type { Product } from "../api";
import { getFirebaseApp } from "../../firebase.js";

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
  categoriesJson?: string;
  cachedAtEpochSeconds?: number;
};

let db: Firestore | null = null;

function configured(): boolean {
  return import.meta.env.VITE_FIRESTORE_CACHE !== "false";
}

function firestore(): Firestore | null {
  if (!configured()) return null;
  if (!db) {
    db = getFirestore(getFirebaseApp());
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
    let categories = DEFAULT_CATEGORIES;
    if (data.categoriesJson) {
      try {
        categories = JSON.parse(data.categoriesJson) as string[];
      } catch {
        categories = DEFAULT_CATEGORIES;
      }
    }
    return { categories, products };
  } catch {
    return null;
  }
}
