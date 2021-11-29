const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/health", (req, res) => {
  res.send("I am up and running!");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(
    `Heroku  to-do application  listening at http://localhost:${port}`
  );
});
