// Import required modules
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

// Initialize Express app
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Path to the JSON file that stores user data and pairs
const DATA_FILE = path.join(__dirname, "data.json");

// Helper function to read JSON data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      users: ["Alice", "Bob", "Charlie", "Diana"],
      pairs: [],
      lastUpdated: null,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
};

// Helper function to write JSON data
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Helper function to generate random pairs
const generatePairs = (users) => {
  const shuffled = [...users].sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const pair = shuffled[i + 1]
      ? [shuffled[i], shuffled[i + 1]]
      : [shuffled[i], "No Partner"];
    pairs.push(pair);
  }
  return pairs;
};

// Check if it's a new week
const isNewWeek = (lastUpdated) => {
  if (!lastUpdated) return true;
  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  const diffInDays = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24));
  return diffInDays >= 7;
};

// Endpoint to fetch pairs
app.get("/pairs", (req, res) => {
  const data = readData();
  if (isNewWeek(data.lastUpdated)) {
    data.pairs = generatePairs(data.users);
    data.lastUpdated = new Date().toISOString();
    writeData(data);
  }
  res.json({ pairs: data.pairs, lastUpdated: data.lastUpdated });
});

// Endpoint to add a user to the list
app.post("/users", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }

  const data = readData();
  if (data.users.includes(name)) {
    return res.status(400).json({ error: "User already exists." });
  }

  data.users.push(name);
  writeData(data);
  res
    .status(201)
    .json({ message: "User added successfully.", users: data.users });
});

// Endpoint to get all users
app.get("/users", (req, res) => {
  const data = readData();
  res.json({ users: data.users });
});

// Endpoint to remove a user from the list
app.delete("/users/:name", (req, res) => {
  const { name } = req.params;

  const data = readData();
  const userIndex = data.users.indexOf(name);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found." });
  }

  data.users.splice(userIndex, 1);
  writeData(data);
  res.json({ message: "User removed successfully.", users: data.users });
});

// Endpoint to reset pairs manually
app.post("/pairs/reset", (req, res) => {
  const data = readData();
  data.pairs = generatePairs(data.users);
  data.lastUpdated = new Date().toISOString();
  writeData(data);
  res.json({ message: "Pairs reset successfully.", pairs: data.pairs });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
