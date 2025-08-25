// db.js - local JSON storage
const fs = require("fs");
const path = require("path");

// store inside ./data/data.json
const filePath = path.join(__dirname, "data", "data.json");

function ensureFile() {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

function loadData() {
  ensureFile();
  const raw = fs.readFileSync(filePath);
  return JSON.parse(raw);
}

function saveData(data) {
  ensureFile();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function saveMessage(user, message, role = "user") {
  const data = loadData();
  data.push({ user, message, role, timestamp: new Date() });
  saveData(data);
}

async function getUserHistory(user, limit = 10) {
  const data = loadData();
  return data
    .filter(m => m.user === user)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

function searchMessages(query, limit = 10) {
  const q = (query || "").toLowerCase();
  if (!q) return [];
  const data = loadData();
  const results = [];
  for (const m of data) {
    const hay = `${m.role}\n${m.message}`.toLowerCase();
    if (hay.includes(q)) results.push(m);
  }
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return results.slice(0, limit);
}

module.exports = { saveMessage, getUserHistory, searchMessages };
