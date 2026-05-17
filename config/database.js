const mongoose = require("mongoose");
const { Pool } = require("pg");
const mysql = require("mysql2/promise");

let pgPool;
let mysqlConnection;

async function connectMongo() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is required in .env");
  }

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected");
  return mongoose;
}

async function connectPostgres() {
  pgPool = new Pool({
    host: process.env.PG_HOST || "127.0.0.1",
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });

  try {
    await pgPool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (error) {
    await pgPool.end();
    pgPool = null;
    throw new Error(`PostgreSQL connection failed: ${error.message}`);
  }

  return pgPool;
}

async function connectMySQL() {
  const rawHost = process.env.MYSQL_HOST || "127.0.0.1";
  const host = rawHost === "localhost" ? "127.0.0.1" : rawHost;
  const port = Number(process.env.MYSQL_PORT || 3306);

  try {
    mysqlConnection = await mysql.createConnection({
      host,
      port,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    await mysqlConnection.execute("SELECT 1");
    console.log("MySQL connected");
    return mysqlConnection;
  } catch (error) {
    if (mysqlConnection && mysqlConnection.end) {
      await mysqlConnection.end();
    }
    mysqlConnection = null;
    throw new Error(`MySQL connection failed to ${host}:${port}: ${error.message}`);
  }
}

function getPostgresPool() {
  if (!pgPool) {
    throw new Error("PostgreSQL pool has not been initialized. Call connectPostgres() first.");
  }
  return pgPool;
}

function getMySQLConnection() {
  if (!mysqlConnection) {
    throw new Error("MySQL connection has not been initialized. Call connectMySQL() first.");
  }
  return mysqlConnection;
}

module.exports = {
  connectMongo,
  connectPostgres,
  connectMySQL,
  getPostgresPool,
  getMySQLConnection,
};
