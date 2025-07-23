const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "supersecretkey";

const users = [
  {
    username: "remwaste",
    password: "$2b$08$4yiVXYSeOh0LPiM4UJYLYuWGcWOl/r.Ut2bY4EuEvi.GVpWk9o8oG",
  }
];

let items = [
  { id: 1, name: "Test Item 1" },
  { id: 2, name: "Test Item 2" },
];

app.get("/", (req, res) => {
  res.json({ message: "RemWaste Backend API is running!" });
});

app.post("/test-hash", (req, res) => {
  const { password } = req.body;
  const testPassword = password || "12345";
  const userHash = users[0].password;
  const isValid = bcrypt.compareSync(testPassword, userHash);
  
  res.json({
    providedPassword: testPassword,
    storedHash: userHash,
    hashMatches: isValid,
    message: isValid ? "✅ Hash works!" : "❌ Hash doesn't match"
  });
});

app.post("/login", (req, res) => {
  console.log("Login attempt:", req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const passwordIsValid = bcrypt.compareSync(password, user.password);
  console.log("Password valid:", passwordIsValid);

  if (!passwordIsValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
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
});
