const path = require("node:path");
const { createDatabase } = require("./backend/src/database");
const { projectService } = require("./backend/src/projectService");
const { createApp } = require("./backend/src/app");

if (require.main === module) {
  const databasePath = process.env.DATABASE_PATH || path.join(__dirname, ".data", "portfolio.sqlite");
  const port = Number(process.env.PORT || 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un número entero entre 1 y 65535.");
  }

  const database = createDatabase(databasePath);
  const services = projectService(database);
  const app = createApp(database, { projectService: services });

  app.listen(port, () => {
    console.log(`Portfolio disponible en http://localhost:${port}`);
  });
}

module.exports = { createApp, createDatabase };
