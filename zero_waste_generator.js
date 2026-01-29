// zero_waste_generator.js
// Zero-Waste Recipe Generator prototype (Node.js, no dependencies)

const fs = require("fs");

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function parseIndexFromName(name, prefix) {
  // e.g. Unit01 -> 1, Ingredient18 -> 18, Quantity02 -> 2
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  const m = name.match(re);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function buildMeasuredIngredient(qty, unit, ing) {
  const q = (qty || "").trim();
  const u = (unit || "").trim();
  const i = (ing || "").trim();

  if (!i) return "";

  // Build a readable line like "2 tbsp olive oil" or "1 onion, chopped"
  const parts = [];
  if (q) parts.push(q);
  if (u) parts.push(u);
  parts.push(i);

  return parts.join(" ");
}

function loadRecipes(csvPath) {
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error("CSV seems empty or missing header.");

  const header = rows[0].map((h) => (h || "").trim());
  const headerLower = header.map((h) => h.toLowerCase());

  const idxTitle = header.indexOf("Title");
  const idxDirections = header.indexOf("Directions");

  if (idxTitle === -1) throw new Error('Missing "Title" column.');
  if (idxDirections === -1) throw new Error('Missing "Directions" column.');

  // This dataset uses Quantity + UnitXX + IngredientXX
  // Note: first Quantity column may be named "Quantity" (no number)
  const qtyByIndex = new Map();   // index -> column position
  const unitByIndex = new Map();  // index -> column position
  const ingByIndex = new Map();   // index -> column position

  for (let i = 0; i < header.length; i++) {
    const name = header[i];

    if (!name) continue;

    // Quantity (no number) is treated as Quantity01
    if (name.toLowerCase() === "quantity") {
      qtyByIndex.set(1, i);
      continue;
    }

    const qIdx = parseIndexFromName(name, "Quantity");
    if (qIdx !== null) {
      qtyByIndex.set(qIdx, i);
      continue;
    }

    const uIdx = parseIndexFromName(name, "Unit");
    if (uIdx !== null) {
      unitByIndex.set(uIdx, i);
      continue;
    }

    const ingIdx = parseIndexFromName(name, "Ingredient");
    if (ingIdx !== null) {
      ingByIndex.set(ingIdx, i);
      continue;
    }
  }

  // Determine max ingredient slot present
  const maxIdx = Math.max(
    1,
    ...Array.from(ingByIndex.keys())
  );

  const recipes = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];

    const title = (row[idxTitle] || "").trim();
    const directions = (row[idxDirections] || "").trim();

    if (!title) continue;

    const ingredientsMeasured = [];
    const ingredientsForMatching = [];

    for (let k = 1; k <= maxIdx; k++) {
      const qty = qtyByIndex.has(k) ? row[qtyByIndex.get(k)] : "";
      const unit = unitByIndex.has(k) ? row[unitByIndex.get(k)] : "";
      const ing = ingByIndex.has(k) ? row[ingByIndex.get(k)] : "";

      const line = buildMeasuredIngredient(qty, unit, ing);
      if (!line) continue;

      ingredientsMeasured.push(line);
      ingredientsForMatching.push(ing); // match against ingredient text only
    }

    if (ingredientsMeasured.length === 0) continue;

    recipes.push({
      title,
      directions,
      ingredientsMeasured,
      ingredientsNorm: ingredientsForMatching.map((x) => normalize(x)),
    });
  }

  return recipes;
}

function isIngredientMatch(recipeIngredientNorm, userIngredientNorm, strictMode) {
  if (!userIngredientNorm) return false;

  if (!strictMode) {
    return recipeIngredientNorm.includes(userIngredientNorm);
  }

  const re = new RegExp(`\\b${escapeRegExp(userIngredientNorm)}\\b`, "i");
  return re.test(recipeIngredientNorm);
}

function countMatches(recipe, userNorm, strictMode) {
  let count = 0;

  for (const ui of userNorm) {
    if (!ui) continue;

    const hit = recipe.ingredientsNorm.some((ri) =>
      isIngredientMatch(ri, ui, strictMode)
    );

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
  for (const ingLine of recipe.ingredientsMeasured) lines.push(`- ${ingLine}`);
  lines.push("");
  lines.push("DIRECTIONS:");

  const dir = (recipe.directions || "").trim();
  if (!dir) {
    lines.push("(No directions provided)");
  } else {
    const steps = dir
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (let i = 0; i < steps.length; i++) {
      lines.push(`${i + 1}. ${steps[i]}.`);
    }
  }

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
  // If you want, you can change the default here to "recipes_forimport.csv"
  const csvPath = getArg("--csv", "recipes.csv");

  const ingredientsArg = getArg("--ingredients", "");
  const threshold = parseInt(getArg("--threshold", "2"), 10);
  const maxOut = parseInt(getArg("--max", "5"), 10);
  const randomize = hasFlag("--random");
  const strictMode = hasFlag("--strict");

  if (!ingredientsArg.trim()) {
    console.log(
      'Usage: node zero_waste_generator.js --ingredients "rice, egg" --threshold 1 --max 3 [--strict] [--random] [--csv recipes.csv]'
    );
    process.exit(1);
  }

  const userIngredients = ingredientsArg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const userNorm = userIngredients.map(normalize);

  console.log("Loading CSV:", csvPath);
  const recipes = loadRecipes(csvPath);
  console.log("Loaded recipes:", recipes.length);

  let matches = recipes
    .map((r) => ({ recipe: r, score: countMatches(r, userNorm, strictMode) }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    console.log("No matches found.");
    console.log(`Input ingredients: ${userIngredients.join(", ")}`);
    console.log(`Threshold: ${threshold}`);
    console.log(`Strict mode: ${strictMode ? "ON" : "OFF"}`);
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
  console.log(`Strict mode: ${strictMode ? "ON" : "OFF"}`);
  console.log(`Matches found: ${matches.length}`);
  console.log("=".repeat(60));

  const shown = matches.slice(0, maxOut);
  for (const item of shown) {
    const r = item.recipe;

    const matched = [];
    for (let i = 0; i < userIngredients.length; i++) {
      const ui = userIngredients[i];
      const uiN = userNorm[i];

      const ok = r.ingredientsNorm.some((ri) =>
        isIngredientMatch(ri, uiN, strictMode)
      );

      if (ok) matched.push(ui);
    }

    console.log(formatRecipe(r, matched));
    console.log("=".repeat(60));
  }
}

main();
