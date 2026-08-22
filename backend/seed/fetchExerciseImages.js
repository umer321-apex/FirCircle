// One-off helper: looks up a real exercise photo for each exercise in
// seedExercises.js from wger.de's free, open exercise database (no API key
// needed) and writes the results to exerciseImages.json. seedExercises.js
// then picks those URLs up automatically on the next `node seed/seedExercises.js`
// run — see the exerciseImages merge at the bottom of that file.
//
// Usage:
//   node seed/fetchExerciseImages.js
//   node seed/seedExercises.js
//
// Safe to re-run — it always looks up every exercise fresh and overwrites
// exerciseImages.json. Exercises wger has no match/image for are simply left
// out, so seedExercises.js's picsum placeholder fallback keeps covering them.
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SEED_FILE = path.join(__dirname, 'seedExercises.js');
const OUTPUT_FILE = path.join(__dirname, 'exerciseImages.json');
const WGER_BASE = 'https://wger.de/api/v2';
const REQUEST_DELAY_MS = 300; // be polite to a free public API — no auth, no rate-limit headers to respect

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exercise names live inside a big literal array in seedExercises.js with no
// separate export (the file self-executes a DB seed on require) — pulling
// them out with a regex instead of requiring the module avoids accidentally
// triggering that seed run and keeps this script decoupled from that file's
// structure changing.
function readExerciseNames() {
  const source = fs.readFileSync(SEED_FILE, 'utf8');
  const names = [...source.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
  if (names.length === 0) {
    throw new Error(`Could not find any exercise names in ${SEED_FILE}`);
  }
  return names;
}

// wger's search endpoint returns full-size + thumbnail image URLs directly on
// each suggestion when available, so a single request is usually enough. If
// the top match has no image but does have an id, we fall back to querying
// the dedicated exerciseimage endpoint for that exercise base.
async function findImageForExercise(name) {
  const searchRes = await axios.get(`${WGER_BASE}/exercise/search/`, {
    params: { term: name, language: 'english', format: 'json' },
    timeout: 10000,
  });

  const suggestions = searchRes.data?.suggestions || [];
  if (suggestions.length === 0) return null;

  const top = suggestions[0].data;
  if (top?.image) return top.image;

  const baseId = top?.base_id ?? top?.id;
  if (!baseId) return null;

  const imageRes = await axios.get(`${WGER_BASE}/exerciseimage/`, {
    params: { exercise_base: baseId, format: 'json' },
    timeout: 10000,
  });
  const firstImage = imageRes.data?.results?.[0];
  return firstImage?.image || null;
}

async function run() {
  const names = readExerciseNames();
  console.log(`Looking up images for ${names.length} exercises from wger.de...`);

  const results = {};
  let found = 0;

  for (const name of names) {
    try {
      const imageUrl = await findImageForExercise(name);
      if (imageUrl) {
        results[name] = imageUrl;
        found += 1;
        console.log(`  ✓ ${name}`);
      } else {
        console.log(`  · ${name} — no match on wger, will keep placeholder`);
      }
    } catch (err) {
      console.warn(`  ✕ ${name} — lookup failed: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2) + '\n');
  console.log(`\nFound images for ${found}/${names.length} exercises.`);
  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log('Run `node seed/seedExercises.js` to apply them.');
}

run().catch((err) => {
  console.error(`[fetchExerciseImages] Fatal error: ${err.message}`);
  process.exit(1);
});
