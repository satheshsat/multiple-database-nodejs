const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectMongo, connectPostgres, connectMySQL } = require("./config/database");

const app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/items", require("./routes/items"));
app.use("/postgres/items", require("./routes/postgresItems"));
app.use("/mysql/items", require("./routes/mysqlItems"));

async function start() {
  try {
    await Promise.all([
      connectMongo(),
      connectPostgres(),
      connectMySQL(),
    ]);

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Running on port ${port}.`);
    });
  } catch (error) {
    console.error("Failed to connect to one or more databases:", error);
    process.exit(1);
  }
}

start();

// Export the Express API
module.exports = app;