const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

// Inicializa la base de datos SQLite y crea las tablas necesarias para
// guardar mensajes de contacto y proyectos del portafolio.
function createDatabase(databasePath) {
  // Cuando no se usa memoria, aseguramos que la carpeta exista antes de abrir SQLite.
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);

  // La tabla de mensajes conserva la información del formulario de contacto.
  // La tabla de proyectos guarda los datos que ahora se gestionan desde el CRUD.
  database.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      technologies TEXT NOT NULL,
      image TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Publicado', 'En desarrollo', 'Borrador')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return database;
}

module.exports = { createDatabase };
