// Módulos de Node.js: permiten trabajar con archivos, rutas y la base SQLite.
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { DatabaseSync } = require("node:sqlite");

// Abre la base de datos y crea la tabla de mensajes si todavía no existe.
function createDatabase(databasePath) {
	// La carpeta de la base persistente podría no existir la primera vez.
	// Para ":memory:" no hace falta crear carpetas: SQLite guarda todo en memoria.
	if (databasePath !== ":memory:") {
		fs.mkdirSync(path.dirname(databasePath), { recursive: true });
	}

	const database = new DatabaseSync(databasePath);
	// Cada fila representa un mensaje. El ID se genera automáticamente
	// y la fecha se completa con la hora actual cuando se guarda.
	database.exec(`
		CREATE TABLE IF NOT EXISTS contact_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			message TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);

	return database;
}

// Configura las rutas y el comportamiento del servidor Express.
function createApp(database) {
	const app = express();
	// Prepara la consulta una vez y usa parámetros para insertar los datos
	// de forma segura, sin concatenarlos directamente en el SQL.
	const saveMessage = database.prepare(
		"INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)"
	);

	// Interpreta solicitudes JSON y limita su tamaño para evitar cargas grandes.
	app.use(express.json({ limit: "10kb" }));

	// Recibe los datos que envía el formulario de contacto del portafolio.
	app.post("/api/contact", (request, response) => {
		const body = request.body;
		// El cuerpo debe ser un objeto JSON; no se aceptan valores vacíos o listas.
		if (!body || typeof body !== "object" || Array.isArray(body)) {
			return response.status(400).json({ error: "Los datos enviados no son válidos." });
		}

		// Los tres campos deben llegar como texto.
		const { nombre, correo, mensaje } = body;
		if (
			typeof nombre !== "string" ||
			typeof correo !== "string" ||
			typeof mensaje !== "string"
		) {
			return response.status(400).json({ error: "Completa todos los campos del formulario." });
		}

		// Quita espacios al principio y al final antes de validar y guardar.
		const name = nombre.trim();
		const email = correo.trim();
		const message = mensaje.trim();

		// Valida que el nombre no esté vacío y respete el límite del formulario.
		if (!name || name.length > 100) {
			return response.status(400).json({ error: "El nombre es obligatorio y debe tener hasta 100 caracteres." });
		}
		// Comprueba el formato básico del correo y evita valores demasiado largos.
		if (
			email.length > 254 ||
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
		) {
			return response.status(400).json({ error: "Escribe un correo electrónico válido." });
		}
		// El mensaje es obligatorio y tiene un máximo para limitar lo que se almacena.
		if (!message || message.length > 5000) {
			return response.status(400).json({ error: "El mensaje es obligatorio y debe tener hasta 5000 caracteres." });
		}

		try {
			// Inserta el mensaje y responde 201, que indica que se creó correctamente.
			const result = saveMessage.run(name, email, message);
			return response.status(201).json({
				message: "Tu mensaje se guardó correctamente.",
				id: result.lastInsertRowid
			});
		} catch (error) {
			// Informa el fallo en el servidor y devuelve un error comprensible al navegador.
			console.error("No se pudo guardar el mensaje de contacto:", error);
			return response.status(500).json({
				error: "No se pudo guardar tu mensaje. Inténtalo nuevamente más tarde."
			});
		}
	});

	// Muestra la página principal cuando se visita la raíz o /index.html.
	app.get(["/", "/index.html"], (request, response) => {
		response.sendFile(path.join(__dirname, "index.html"));
	});
	// Publica los archivos que necesita la página: imágenes, JavaScript y CSS.
	for (const directory of ["assets", "js", "style"]) {
		app.use(`/${directory}`, express.static(path.join(__dirname, directory)));
	}

	// Maneja errores generados al interpretar el cuerpo de una solicitud.
	app.use((error, request, response, next) => {
		// Si ya se empezó a responder, deja que Express procese el error pendiente.
		if (response.headersSent) {
			return next(error);
		}
		// 413 indica que la solicitud superó el límite de tamaño configurado.
		if (error.type === "entity.too.large") {
			return response.status(413).json({ error: "La solicitud es demasiado grande." });
		}
		// Un JSON mal formado no se puede interpretar y se responde como solicitud inválida.
		if (error instanceof SyntaxError && "body" in error) {
			return response.status(400).json({ error: "El formato de los datos enviados no es válido." });
		}

		// Registra otros errores inesperados y evita revelar detalles internos al visitante.
		console.error("Error al procesar la solicitud:", error);
		return response.status(500).json({ error: "Ocurrió un error interno." });
	});

	// Devuelve la aplicación configurada para poder iniciarla o probarla.
	return app;
}

// Este bloque solo se ejecuta al arrancar server.js directamente.
// Cuando otro archivo lo importa para las pruebas, el servidor no se inicia.
if (require.main === module) {
	// Permite cambiar la ubicación de la base o el puerto mediante variables de entorno.
	// Si no se indican, usa .data/portfolio.sqlite y el puerto 3000.
	const databasePath = process.env.DATABASE_PATH || path.join(__dirname, ".data", "portfolio.sqlite");
	const port = Number(process.env.PORT || 3000);
	// Comprueba el puerto antes de iniciar el servidor para mostrar un error claro.
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error("PORT debe ser un número entero entre 1 y 65535.");
	}

	// Prepara la base, crea la aplicación y comienza a escuchar solicitudes.
	const database = createDatabase(databasePath);
	const app = createApp(database);
	app.listen(port, () => {
		console.log(`Portfolio disponible en http://localhost:${port}`);
	});
}

// Exporta estas funciones para que las pruebas puedan crear una app
// y una base temporal sin iniciar el servidor normal.
module.exports = { createApp, createDatabase };
