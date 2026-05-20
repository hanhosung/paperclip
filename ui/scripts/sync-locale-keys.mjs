#!/usr/bin/env node
/**
 * sync-locale-keys.mjs — keep every locale JSON key-aligned with en.json.
 *
 * ui/src/i18n/locale-validation.ts requires EVERY locale file to have exactly
 * the same key set as en.json (missing OR extra keys both fail validation, which
 * runs at module load in locales.ts). en.json is the canonical reference.
 *
 * This rebuilds each non-en locale to follow en.json's structure:
 *   - key already translated in the locale (same type) → keep it
 *   - key missing → fill with en.json's English value (untranslated placeholder)
 *   - key not in en.json → dropped (enforces "no extra keys")
 *
 * Run after adding new keys to en.json (and translating them in ko.json):
 *   node ui/scripts/sync-locale-keys.mjs
 *
 * Korean is the active target locale of this fork — ko.json is hand-translated;
 * other locales get English placeholders until/unless separately translated.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const localesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "i18n", "locales");
const en = JSON.parse(readFileSync(join(localesDir, "en.json"), "utf8"));

/** Rebuild `loc` following `ref` (en.json) structure. */
function reconcile(ref, loc) {
  if (typeof ref === "string") {
    return typeof loc === "string" ? loc : ref;
  }
  const out = {};
  for (const key of Object.keys(ref)) {
    const locValue = loc && typeof loc === "object" && !Array.isArray(loc) ? loc[key] : undefined;
    out[key] = reconcile(ref[key], locValue);
  }
  return out;
}

/** Count keys still holding the English value (i.e. untranslated). */
function untranslatedCount(ref, loc) {
  if (typeof ref === "string") return loc === ref ? 1 : 0;
  return Object.keys(ref).reduce((n, k) => n + untranslatedCount(ref[k], loc?.[k]), 0);
}

const files = readdirSync(localesDir).filter((f) => f.endsWith(".json") && f !== "en.json");
let changed = 0;
for (const file of files) {
  const path = join(localesDir, file);
  const before = readFileSync(path, "utf8");
  const reconciled = reconcile(en, JSON.parse(before));
  const after = JSON.stringify(reconciled, null, 2) + "\n";
  if (after !== before) {
    writeFileSync(path, after);
    changed += 1;
    const untx = untranslatedCount(en, reconciled);
    console.log(`  updated ${file}${untx ? `  (${untx} key(s) still English)` : ""}`);
  }
}
console.log(`\nsynced ${changed}/${files.length} locale file(s) to en.json structure`);
