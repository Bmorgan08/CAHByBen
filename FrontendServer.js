const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Serve files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Redirect root to Main.html
app.get("/", (req, res) => {
  res.redirect("/Main.html");
});

app.listen(port, () => {
  console.log(`Frontend server running at http://localhost:${port}`);
});

