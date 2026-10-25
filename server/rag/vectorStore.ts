import { GoogleGenAI } from "@google/genai";
import { SEED_VENDORS } from "../data/vendors.ts";
import { SEED_THEMES, SEED_CULTURE_GUIDES } from "../data/themesAndCulture.ts";
import {
  Vendor,
  ThemeSeed,
  CultureSeed,
  EventInput,
  VendorCategory,
} from "../../src/shared/schemas.ts";

interface IndexedDoc<T> {
  id: string;
  text: string;
  tokens: Map<string, number>;
  norm: number;
  embedding?: number[];
  item: T;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildTermVector(text: string): { tokens: Map<string, number>; norm: number } {
  const words = tokenize(text);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  let sumSq = 0;
  for (const v of freq.values()) {
    sumSq += v * v;
  }
  return { tokens: freq, norm: Math.sqrt(sumSq) || 1 };
}

function lexicalCosine(
  q: { tokens: Map<string, number>; norm: number },
  d: { tokens: Map<string, number>; norm: number }
): number {
  let dot = 0;
  for (const [term, qWeight] of q.tokens.entries()) {
    const dWeight = d.tokens.get(term);
    if (dWeight) dot += qWeight * dWeight;
  }
  return dot / (q.norm * d.norm);
}

function denseCosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na || 1) * Math.sqrt(nb || 1));
}

class CelebrationVectorStore {
  private vendorDocs: IndexedDoc<Vendor>[] = [];
  private themeDocs: IndexedDoc<ThemeSeed>[] = [];
  private cultureDocs: IndexedDoc<CultureSeed>[] = [];
  private embeddingsHydrated = false;

  constructor() {
    this.vendorDocs = SEED_VENDORS.map((v) => {
      const text = `${v.name} ${v.category} ${v.city} ${v.tags.join(" ")} ${v.description}`;
      const tv = buildTermVector(text);
      return { id: v.id, text, ...tv, item: v };
    });

    this.themeDocs = SEED_THEMES.map((t) => {
      const text = `${t.name} ${t.eventTypes.join(" ")} ${t.vibeTags.join(" ")} ${t.description} ${t.moodBoardNotes}`;
      const tv = buildTermVector(text);
      return { id: t.id, text, ...tv, item: t };
    });

    this.cultureDocs = SEED_CULTURE_GUIDES.map((c) => {
      const text = `${c.title} ${c.eventTypes.join(" ")} ${c.regionOrTradition} ${c.keyRituals.join(" ")} ${c.regionalFoodHighlights.join(" ")}`;
      const tv = buildTermVector(text);
      return { id: c.id, text, ...tv, item: c };
    });
  }

  private embeddingWarmupInFlight = false;

  warmEmbeddingsInBackground(ai: GoogleGenAI | null): void {
    if (
      this.embeddingsHydrated ||
      this.embeddingWarmupInFlight ||
      !ai ||
      !process.env.GEMINI_API_KEY
    ) {
      return;
    }
    this.embeddingWarmupInFlight = true;
    const texts = [
      ...this.themeDocs.map((d) => d.text),
      ...this.cultureDocs.map((d) => d.text),
    ];
    ai.models
      .embedContent({
        model: "gemini-embedding-2-preview",
        contents: texts,
      })
      .then((res) => {
        const embeddings = res.embeddings || [];
        let idx = 0;
        for (const doc of this.themeDocs) {
          if (embeddings[idx]?.values) doc.embedding = embeddings[idx].values;
          idx++;
        }
        for (const doc of this.cultureDocs) {
          if (embeddings[idx]?.values) doc.embedding = embeddings[idx].values;
          idx++;
        }
        this.embeddingsHydrated = true;
      })
      .catch(() => {
        // Offline or embedding quota unavailable — lexical cosine stays active seamlessly
      })
      .finally(() => {
        this.embeddingWarmupInFlight = false;
      });
  }

  async retrieveContextForEvent(
    input: EventInput,
    _ai: GoogleGenAI | null,
    extraQuery = ""
  ): Promise<{
    vendorsByCategory: Record<VendorCategory, Vendor[]>;
    topThemes: ThemeSeed[];
    topCulture: CultureSeed[];
  }> {
    const queryText = `${input.title} ${input.eventType} ${input.subTradition} ${input.city} ${input.vibePreferences} ${input.dietaryNeeds.join(" ")} ${extraQuery}`;
    const qLex = buildTermVector(queryText);
    const qDense: number[] | undefined = undefined;

    const categories: VendorCategory[] = [
      "venue",
      "catering",
      "decor",
      "entertainment",
      "photography",
      "makeup",
    ];
    const vendorsByCategory = {} as Record<VendorCategory, Vendor[]>;

    for (const cat of categories) {
      const cityDocs = this.vendorDocs.filter(
        (d) => d.item.city === input.city && d.item.category === cat
      );
      const pool =
        cityDocs.length > 0
          ? cityDocs
          : this.vendorDocs.filter((d) => d.item.category === cat);

      const categoryBudgetCap = input.totalBudget * 0.48;
      const scored = pool.map((doc) => {
        let score = lexicalCosine(qLex, doc) * 2.5 + doc.item.rating * 0.15;
        if (doc.item.priceMin <= categoryBudgetCap) score += 0.5;
        if (
          input.dietaryNeeds.some((dn) =>
            doc.text.includes(dn.toLowerCase().split(" ")[0])
          )
        ) {
          score += 0.35;
        }
        return { doc, score };
      });
      scored.sort((a, b) => b.score - a.score);
      vendorsByCategory[cat] = scored.slice(0, 3).map((s) => s.doc.item);
    }

    const scoredThemes = this.themeDocs.map((doc) => {
      let score = lexicalCosine(qLex, doc) * 2.0;
      if (qDense && doc.embedding) {
        score += denseCosine(qDense, doc.embedding) * 2.0;
      }
      if (doc.item.eventTypes.includes(input.eventType)) score += 1.2;
      return { item: doc.item, score };
    });
    scoredThemes.sort((a, b) => b.score - a.score);

    const scoredCulture = this.cultureDocs.map((doc) => {
      let score = lexicalCosine(qLex, doc) * 2.0;
      if (qDense && doc.embedding) {
        score += denseCosine(qDense, doc.embedding) * 2.0;
      }
      if (doc.item.eventTypes.includes(input.eventType)) score += 1.2;
      return { item: doc.item, score };
    });
    scoredCulture.sort((a, b) => b.score - a.score);

    return {
      vendorsByCategory,
      topThemes: scoredThemes.slice(0, 3).map((t) => t.item),
      topCulture: scoredCulture.slice(0, 2).map((c) => c.item),
    };
  }

  filterVendors(params: {
    city?: string;
    category?: string;
    maxPrice?: number;
    search?: string;
  }): Vendor[] {
    let list = [...SEED_VENDORS];
    if (params.city && params.city !== "All") {
      list = list.filter((v) => v.city === params.city);
    }
    if (params.category && params.category !== "all") {
      list = list.filter((v) => v.category === params.category);
    }
    if (params.maxPrice && params.maxPrice > 0) {
      list = list.filter((v) => v.priceMin <= params.maxPrice!);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.rating - a.rating);
  }

  getVendorById(id: string): Vendor | undefined {
    return SEED_VENDORS.find((v) => v.id === id);
  }
}

export const vectorStore = new CelebrationVectorStore();
