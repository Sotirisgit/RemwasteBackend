const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "supersecretkey";

// Generate a fresh hash for "12345" - let's create it dynamically
const generateHash = () => {
  return bcrypt.hashSync("12345", 8);
};

// ✅ User with dynamically generated hash
const users = [
  {
    username: "remwaste",
    password: generateHash(), // Fresh hash every time
  }
];

let items = [
  { id: 1, name: "Test Item 1" },
  { id: 2, name: "Test Item 2" },
];

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "RemWaste Backend API is running!",
    endpoints: ["/login", "/items", "/test-hash"]
  });
});

// Test endpoint to debug bcrypt
app.post("/test-hash", (req, res) => {
  const { password } = req.body;
  const testHash = generateHash();
  const isValid = bcrypt.compareSync(password || "12345", testHash);
  
  res.json({
    providedPassword: password,
    testPassword: "12345",
    generatedHash: testHash,
    isValidMatch: isValid,
    userHash: users[0].password,
    userHashMatch: bcrypt.compareSync(password || "12345", users[0].password)
  });
});

app.post("/login", (req, res) => {
  console.log("=== LOGIN ATTEMPT ===");
  console.log("Request body:", req.body);
  
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    console.log("Missing username or password");
    return res.status(400).json({ error: "Username and password are required" });
  }
  
  // Find user
  const user = users.find((u) => u.username === username);
  console.log("User found:", !!user);
  console.log("Available users:", users.map(u => u.username));

  if (!user) {
    console.log("User not found for username:", username);
    return res.status(401).json({ error: "User not found" });
  }

  // Check password
  console.log("Checking password...");
  console.log("Provided password:", password);
  console.log("Stored hash:", user.password);
  
  const passwordIsValid = bcrypt.compareSync(password, user.password);
  console.log("Password is valid:", passwordIsValid);

  if (!passwordIsValid) {
    console.log("Password validation failed");
    return res.status(401).json({ error: "Invalid password" });
  }

  // Generate token
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
  console.log("Login successful! Token generated.");
  console.log("=== LOGIN SUCCESS ===");
  
  res.json({ token });
});

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

app.get("/items", verifyToken, (req, res) => {
  res.json(items);
});

app.post("/items", verifyToken, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Item name is required" });
  }
  const newItem = { id: Date.now(), name };
  items.push(newItem);
  res.json(newItem);
});

app.put("/items/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "Item name is required" });
  }
  
  const item = items.find((item) => item.id === parseInt(id));
  if (!item) return res.status(404).json({ error: "Item not found" });
  
  item.name = name;
  res.json(item);
});

app.delete("/items/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const originalLength = items.length;
  items = items.filter((item) => item.id !== parseInt(id));
  
  if (items.length === originalLength) {
    return res.status(404).json({ error: "Item not found" });
  }
  
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Available users: ${users.map(u => u.username).join(', ')}`);
  console.log(`Test password: 12345`);
});


