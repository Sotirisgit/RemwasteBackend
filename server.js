const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "secret";
let users = [{ username: "test", password: bcrypt.hashSync("1234", 8) }];
let items = [{ id: 1, name: "Sample Item" }];
let idCounter = 2;

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    return res.json({ token });
  }
  return res.status(401).json({ message: "Invalid credentials" });
});

// CRUD routes for items
app.get("/items", (req, res) => res.json(items));

app.post("/items", (req, res) => {
  const item = { id: idCounter++, name: req.body.name };
  items.push(item);
  res.status(201).json(item);
});

app.put("/items/:id", (req, res) => {
  const item = items.find((i) => i.id == req.params.id);
  if (!item) return res.sendStatus(404);
  item.name = req.body.name;
  res.json(item);
});

app.delete("/items/:id", (req, res) => {
  items = items.filter((i) => i.id != req.params.id);
  res.sendStatus(204);
});

//For running localy
//app.listen(4000, () => console.log("API running http://localhost:4000"));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`)); //render


