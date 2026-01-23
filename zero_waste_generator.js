// zero_waste_generator.js
// Minimal Zero-Waste Recipe Generator prototype (Node.js, no dependencies)

const fs = require("fs");

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple CSV parser that handles quoted fields and commas inside quotes
function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;

      row.push(cell);
      cell = "";

      if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function loadRecipes(csvPath) {
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error("CSV seems empty or missing header.");

  const header = rows[0];
  const idxTitle = header.indexOf("Title");
  const idxDirections = header.indexOf("Directions");

  const ingredientIdxs = header
    .map((h, i) => ({ h: h.toLowerCase(), i }))
    .filter((x) => x.h.startsWith("ingredient"))
    .map((x) => x.i);

  if (idxTitle === -1) throw new Error('Missing "Title" column.');
  if (idxDirections === -1) throw new Error('Missing "Directions" column.');
  if (ingredientIdxs.length === 0) throw new Error("No Ingredient columns found.");

  const recipes = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = (row[idxTitle] || "").trim();
    const directions = (row[idxDirections] || "").trim();

    const ingredientsRaw = ingredientIdxs
      .map((i) => (row[i] || "").trim())
      .filter((v) => v.length > 0);

    if (!title || ingredientsRaw.length === 0) continue;

    recipes.push({
      title,
      directions,
      ingredientsRaw,
      ingredientsNorm: ingredientsRaw.map(normalize),
    });
  }

  return recipes;
}

function countMatches(recipe, userNorm) {
  let count = 0;
  for (const ui of userNorm) {
    if (!ui) continue;
    const hit = recipe.ingredientsNorm.some((ri) => ri.includes(ui));
    if (hit) count++;
  }
  return count;
}

function formatRecipe(recipe, matched) {
  const lines = [];
  lines.push(`RECIPE: ${recipe.title}`);
  lines.push(`MATCHED: ${matched.length ? matched.join(", ") : "none"}`);
  lines.push("");
  lines.push("INGREDIENTS:");
  for (const ing of recipe.ingredientsRaw) lines.push(`- ${ing}`);
  lines.push("");
  lines.push("DIRECTIONS:");
  lines.push(recipe.directions || "(No directions provided)");
  return lines.join("\n");
}

function getArg(name, defaultValue = null) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return defaultValue;
  return process.argv[idx + 1] ?? defaultValue;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function main() {
  const csvPath = getArg("--csv", "recipes.csv");
  const ingredientsArg = getArg("--ingredients", "");
  const threshold = parseInt(getArg("--threshold", "2"), 10);
  const maxOut = parseInt(getArg("--max", "5"), 10);
  const randomize = hasFlag("--random");

  if (!ingredientsArg.trim()) {
    console.log('Usage: node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 3');
    process.exit(1);
  }

  const userIngredients = ingredientsArg.split(",").map((s) => s.trim()).filter(Boolean);
  const userNorm = userIngredients.map(normalize);

  console.log("Loading CSV:", csvPath);
  const recipes = loadRecipes(csvPath);
  console.log("Loaded recipes:", recipes.length);

  let matches = recipes
    .map((r) => ({ recipe: r, score: countMatches(r, userNorm) }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    console.log("No matches found.");
    console.log(`Input ingredients: ${userIngredients.join(", ")}`);
    console.log(`Threshold: ${threshold}`);
    return;
  }

  if (randomize) {
    for (let i = matches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matches[i], matches[j]] = [matches[j], matches[i]];
    }
  }

  console.log("ZERO-WASTE RECIPE GENERATOR OUTPUT");
  console.log(`Input ingredients: ${userIngredients.join(", ")}`);
  console.log(`Threshold: ${threshold}`);
  console.log(`Matches found: ${matches.length}`);
  console.log("=".repeat(60));

  const shown = matches.slice(0, maxOut);
  for (const item of shown) {
    const r = item.recipe;

    const matched = [];
    for (let i = 0; i < userIngredients.length; i++) {
      const ui = userIngredients[i];
      const uiN = userNorm[i];
      if (r.ingredientsNorm.some((ri) => ri.includes(uiN))) matched.push(ui);
    }

    console.log(formatRecipe(r, matched));
    console.log("=".repeat(60));
  }
}

main();
