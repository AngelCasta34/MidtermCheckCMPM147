// docs/app.js
// Browser version of the Zero-Waste Recipe Generator (no deps)

// ---------- Matching helpers (plural-friendly) ----------

function singularizeToken(token) {
  const w = (token || "").trim();
  if (!w) return "";

  // light stemming for common plurals
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y"; // berries -> berry
  if (w.endsWith("es") && w.length > 3) return w.slice(0, -2);        // tomatoes -> tomato (rough)
  if (w.endsWith("s") && w.length > 3) return w.slice(0, -1);         // eggs -> egg
  return w;
}

function normalize(text) {
  const cleaned = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map(singularizeToken)
    .join(" ");
}

function escapeRegExp(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Fix Excel auto-date fractions like "4-Jan" -> "1/4", "3-Feb" -> "2/3", "4-Mar" -> "3/4"
function fixExcelFraction(qtyRaw) {
  const s = (qtyRaw || "").trim();
  if (!s) return "";

  const m = s.match(/^(\d+)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i);
  if (!m) return s;

  const day = parseInt(m[1], 10); // denominator
  const mon = m[2].toLowerCase();
  const monthToNumerator = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };

  const num = monthToNumerator[mon];
  if (!num || !day) return s;

  return `${num}/${day}`;
}

// CSV parser that handles quoted fields and commas inside quotes
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
      if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) rows.push(row);
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
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  const m = (name || "").match(re);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function buildMeasuredIngredient(qty, unit, ing) {
  const i = (ing || "").trim();
  if (!i) return "";

  const qFixed = fixExcelFraction(qty);
  const q = (qFixed || "").trim();
  const u = (unit || "").trim();

  const parts = [];
  if (q) parts.push(q);
  if (u) parts.push(u);
  parts.push(i);

  return parts.join(" ");
}

function isIngredientMatch(recipeIngredientNorm, userIngredientNorm, strictMode) {
  if (!userIngredientNorm) return false;

  if (!strictMode) {
    return recipeIngredientNorm.includes(userIngredientNorm);
  }

  const re = new RegExp(`\\b${escapeRegExp(userIngredientNorm)}\\b`, "i");
  return re.test(recipeIngredientNorm);
}

function splitDirectionsSmart(text) {
  const t = (text || "").trim();
  if (!t) return [];

  // Split on sentence end when next token starts with a letter (avoids decimals like 7.5)
  // Also handles ! and ?
  const parts = [];
  let start = 0;

  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    const next = t[i + 1] || "";
    const afterNext = t[i + 2] || "";

    // require ". " then a letter to split
    if (next === " " && /[A-Za-z(]/.test(afterNext)) {
      const seg = t.slice(start, i + 1).trim();
      if (seg) parts.push(seg);
      start = i + 2;
    }
  }

  const tail = t.slice(start).trim();
  if (tail) parts.push(tail);

  if (parts.length === 0) return [t];
  return parts;
}

function loadRecipesFromCSVText(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) throw new Error("CSV seems empty or missing header.");

  const header = rows[0].map((h) => (h || "").trim());
  const idxTitle = header.indexOf("Title");
  const idxDirections = header.indexOf("Directions");
  if (idxTitle === -1) throw new Error('Missing "Title" column.');
  if (idxDirections === -1) throw new Error('Missing "Directions" column.');

  const qtyByIndex = new Map();
  const unitByIndex = new Map();
  const ingByIndex = new Map();

  for (let i = 0; i < header.length; i++) {
    const name = header[i];
    if (!name) continue;

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

  const maxIdx = Math.max(1, ...Array.from(ingByIndex.keys()));

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
      ingredientsForMatching.push(ing);
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

function countMatches(recipe, userNorm, strictMode) {
  let count = 0;
  for (const ui of userNorm) {
    if (!ui) continue;
    const hit = recipe.ingredientsNorm.some((ri) => isIngredientMatch(ri, ui, strictMode));
    if (hit) count++;
  }
  return count;
}

// ---------- PDF export ----------

function downloadRecipePDF(recipe) {
  // Requires jsPDF loaded in index.html
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF export not loaded. Add the jsPDF script tag to index.html.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;

  let y = margin;

  const addWrapped = (text, fontSize = 12, lineGap = 16) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(String(text || ""), maxW);
    for (const line of lines) {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineGap;
    }
  };

  // Title
  addWrapped(recipe.title, 18, 22);
  y += 6;

  // Ingredients
  addWrapped("Ingredients:", 13, 18);
  recipe.ingredientsMeasured.forEach((ing) => addWrapped(`- ${ing}`, 12, 16));

  y += 8;

  // Directions
  addWrapped("Directions:", 13, 18);
  const steps = splitDirectionsSmart(recipe.directions);
  if (steps.length === 0) {
    addWrapped("(No directions provided)", 12, 16);
  } else {
    steps.forEach((step, i) => addWrapped(`${i + 1}. ${step}`, 12, 16));
  }

  const safeName = recipe.title.replace(/[\/\\:*?"<>|]+/g, "").trim() || "recipe";
  doc.save(`${safeName}.pdf`);
}

// ---------- UI ----------

const els = {
  ingredients: document.getElementById("ingredients"),
  threshold: document.getElementById("threshold"),
  maxOut: document.getElementById("maxOut"),
  strict: document.getElementById("strict"),
  randomize: document.getElementById("randomize"),
  generate: document.getElementById("generate"),
  clear: document.getElementById("clear"),
  status: document.getElementById("status"),
  stats: document.getElementById("stats"),
  results: document.getElementById("results"),
  footerNote: document.getElementById("footerNote"),
};

let g_recipes = [];

function setStatus(text, kind = "") {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? ` ${kind}` : "");
}

function renderResults(matches, userIngredients, strictMode, threshold, maxOut) {
  els.results.innerHTML = "";

  const shown = matches.slice(0, maxOut);
  for (const item of shown) {
    const r = item.recipe;

    const matched = [];
    for (let i = 0; i < userIngredients.length; i++) {
      const ui = userIngredients[i];
      const uiN = normalize(ui);
      const ok = r.ingredientsNorm.some((ri) => isIngredientMatch(ri, uiN, strictMode));
      if (ok) matched.push(ui);
    }

    const card = document.createElement("article");
    card.className = "card";

    const head = document.createElement("div");
    head.className = "cardHead";

    const title = document.createElement("h2");
    title.className = "title";
    title.textContent = r.title;

    const badges = document.createElement("div");
    badges.className = "badges";

    // Only show matched ingredients as badges
    for (const m of matched) {
      const b = document.createElement("span");
      b.className = "badge hit";
      b.textContent = m;
      badges.appendChild(b);
    }

    head.appendChild(title);
    head.appendChild(badges);

    // Download PDF button (per recipe)
    const dl = document.createElement("button");
    dl.className = "btn";
    dl.textContent = "Download PDF";
    dl.addEventListener("click", () => downloadRecipePDF(r));

    const ingTitle = document.createElement("div");
    ingTitle.className = "sectionTitle";
    ingTitle.textContent = "INGREDIENTS";

    const ingList = document.createElement("ul");
    ingList.className = "list";
    for (const ing of r.ingredientsMeasured) {
      const li = document.createElement("li");
      li.textContent = ing;
      ingList.appendChild(li);
    }

    const dirTitle = document.createElement("div");
    dirTitle.className = "sectionTitle";
    dirTitle.textContent = "DIRECTIONS";

    const dirList = document.createElement("ol");
    dirList.className = "list";

    const steps = splitDirectionsSmart(r.directions);
    if (steps.length === 0) {
      const li = document.createElement("li");
      li.textContent = "(No directions provided)";
      dirList.appendChild(li);
    } else {
      for (const s of steps) {
        const li = document.createElement("li");
        li.textContent = s.replace(/\s+/g, " ").trim();
        dirList.appendChild(li);
      }
    }

    card.appendChild(head);
    card.appendChild(dl);
    card.appendChild(ingTitle);
    card.appendChild(ingList);
    card.appendChild(dirTitle);
    card.appendChild(dirList);

    els.results.appendChild(card);
  }
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function runGenerator() {
  const ingredientsArg = (els.ingredients.value || "").trim();
  const threshold = Math.max(1, parseInt(els.threshold.value || "1", 10));
  const maxOut = Math.max(1, parseInt(els.maxOut.value || "5", 10));
  const strictMode = !!els.strict.checked;
  const randomize = !!els.randomize.checked;

  els.stats.textContent = "";

  if (!ingredientsArg) {
    setStatus("Enter at least one ingredient.", "error");
    els.results.innerHTML = "";
    return;
  }

  const userIngredients = ingredientsArg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const userNorm = userIngredients.map(normalize);

  let matches = g_recipes
    .map((r) => ({ recipe: r, score: countMatches(r, userNorm, strictMode) }))
    .filter((x) => x.score >= threshold)
    .sort((a, b) => b.score - a.score);

  if (randomize) shuffleInPlace(matches);

  if (matches.length === 0) {
    setStatus("No matches found.", "error");
    els.results.innerHTML = "";
    els.stats.textContent =
      `Input: ${userIngredients.join(", ")} | threshold: ${threshold} | strict: ${strictMode ? "on" : "off"}`;
    return;
  }

  setStatus("Ready.", "ok");
  els.stats.textContent =
    `Recipes loaded: ${g_recipes.length} | matches: ${matches.length} | showing: ${Math.min(maxOut, matches.length)}`;

  renderResults(matches, userIngredients, strictMode, threshold, maxOut);
}

async function boot() {
  try {
    const url = "recipes.csv";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
    const text = await res.text();

    g_recipes = loadRecipesFromCSVText(text);

    setStatus("Ready.", "ok");
    els.footerNote.textContent = `Loaded ${g_recipes.length} recipes from ${url}.`;

    if (!els.ingredients.value.trim()) {
      els.ingredients.value = "rice, eggs";
    }

    runGenerator();
  } catch (err) {
    console.error(err);
    setStatus(String(err.message || err), "error");
    els.footerNote.textContent =
      "CSV not found. Make sure recipes.csv is in the same folder as index.html inside docs/.";
  }
}

function clearUI() {
  els.ingredients.value = "";
  els.results.innerHTML = "";
  els.stats.textContent = "";
  setStatus("Cleared.", "");
}

// Events
els.generate.addEventListener("click", runGenerator);

els.clear.addEventListener("click", clearUI);
els.clear.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") clearUI();
});

els.ingredients.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runGenerator();
});

boot();
