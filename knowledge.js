// knowledge.js - load local guides and retrieve relevant snippets
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

function listGuideFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const all = fs.readdirSync(DATA_DIR);
  return all
    .filter(f => !f.toLowerCase().endsWith("data.json"))
    .filter(f => [".md", ".txt", ".json"].includes(path.extname(f).toLowerCase()))
    .map(f => path.join(DATA_DIR, f));
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_) {
    return "";
  }
}

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(
  [
    "the","a","an","and","or","of","to","in","is","it","that","for","on","with","as","are","be","was","were","by","this","you","your"
  ]
);

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter(Boolean)
    .filter(t => !STOPWORDS.has(t));
}

function scoreText(queryTokens, text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  let overlap = 0;
  const set = new Set(tokens);
  for (const q of queryTokens) if (set.has(q)) overlap += 1;
  return overlap / Math.sqrt(tokens.length);
}

function chunkText(text, chunkSize = 800, chunkOverlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    chunks.push(text.slice(start, end));
    start += chunkSize - chunkOverlap;
  }
  return chunks;
}

function parseJsonGuide(content) {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data
        .map(item => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const values = Object.values(item).filter(v => typeof v === "string");
            return values.join("\n");
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
    }
    if (data && typeof data === "object") {
      return Object.values(data)
        .filter(v => typeof v === "string")
        .join("\n");
    }
    return "";
  } catch (_) {
    return "";
  }
}

function loadGuides() {
  const files = listGuideFiles();
  const docs = [];
  for (const file of files) {
    const raw = safeReadFile(file);
    let text = raw;
    if (path.extname(file).toLowerCase() === ".json") {
      text = parseJsonGuide(raw);
    }
    const chunks = chunkText(text);
    for (const ch of chunks) {
      docs.push({ source: path.basename(file), content: ch });
    }
  }
  return docs;
}

// Cache guides in memory; invalidate if needed by restarting server
const GUIDES = loadGuides();

function retrieveRelevantGuides(query, topK = 5) {
  const qTokens = tokenize(query);
  const scored = GUIDES
    .map(d => ({ ...d, score: scoreText(qTokens, d.content) }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}

module.exports = { retrieveRelevantGuides };


