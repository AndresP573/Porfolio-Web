const express = require("express");
const path = require("node:path");
const { normalizeProjectInput } = require("./projectUtils");

// Crea la aplicación Express y centraliza la lógica del backend.
// Aquí se definen los endpoints del portfolio y la conexión con la base de datos.
function createApp(database, { projectService } = {}) {
  const app = express();
  const saveMessage = database.prepare(
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)"
  );

  // Si no se inyecta el servicio de proyectos, se deja una implementación vacía para
  // evitar que la app falle en pruebas o en entornos mínimos.
  const services = projectService ?? { listProjects: () => [] };

  // Limita el tamaño de las peticiones JSON para evitar datos innecesarios o ataques.
  app.use(express.json({ limit: "10kb" }));

  // Endpoint para guardar los mensajes del formulario de contacto.
  app.post("/api/contact", (request, response) => {
    const body = request.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return response.status(400).json({ error: "Los datos enviados no son válidos." });
    }

    const { nombre, correo, mensaje } = body;
    if (
      typeof nombre !== "string" ||
      typeof correo !== "string" ||
      typeof mensaje !== "string"
    ) {
      return response.status(400).json({ error: "Completa todos los campos del formulario." });
    }

    const name = nombre.trim();
    const email = correo.trim();
    const message = mensaje.trim();

    if (!name || name.length > 100) {
      return response.status(400).json({ error: "El nombre es obligatorio y debe tener hasta 100 caracteres." });
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: "Escribe un correo electrónico válido." });
    }
    if (!message || message.length > 5000) {
      return response.status(400).json({ error: "El mensaje es obligatorio y debe tener hasta 5000 caracteres." });
    }

    try {
      const result = saveMessage.run(name, email, message);
      return response.status(201).json({
        message: "Tu mensaje se guardó correctamente.",
        id: result.lastInsertRowid,
      });
    } catch (error) {
      console.error("No se pudo guardar el mensaje de contacto:", error);
      return response.status(500).json({ error: "No se pudo guardar tu mensaje. Inténtalo nuevamente más tarde." });
    }
  });

  // Lista todos los proyectos que estén guardados en la base de datos.
  app.get("/api/projects", (request, response) => {
    const projects = services.listProjects();
    return response.json(projects);
  });

  // Crea un nuevo proyecto con validación básica de campos y estado permitido.
  app.post("/api/projects", (request, response) => {
    const input = normalizeProjectInput(request.body ?? {});
    const { name, description, technologies, image, status } = input;

    if (!name || name.length > 100) {
      return response.status(400).json({ error: "El nombre del proyecto es obligatorio y debe tener hasta 100 caracteres." });
    }
    if (!description || description.length > 1000) {
      return response.status(400).json({ error: "La descripción es obligatoria y debe tener hasta 1000 caracteres." });
    }
    if (!Array.isArray(technologies) || technologies.length === 0 || technologies.length > 12) {
      return response.status(400).json({ error: "Debes indicar entre 1 y 12 tecnologías." });
    }
    if (!image || image.length > 500) {
      return response.status(400).json({ error: "La imagen o enlace representativo es obligatorio." });
    }
    if (!/^(Publicado|En desarrollo|Borrador)$/.test(status)) {
      return response.status(400).json({ error: "El estado del proyecto no es válido." });
    }

    try {
      const project = services.createProject({
        name,
        description,
        technologies,
        image,
        status,
      });
      return response.status(201).json(project);
    } catch (error) {
      console.error("No se pudo crear el proyecto:", error);
      return response.status(500).json({ error: "No se pudo guardar el proyecto." });
    }
  });

  // Permite modificar la información de un proyecto ya registrado.
  app.put("/api/projects/:id", (request, response) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return response.status(400).json({ error: "El identificador del proyecto no es válido." });
    }

    const input = normalizeProjectInput(request.body ?? {});
    const project = services.updateProject(id, input);

    if (!project) {
      return response.status(404).json({ error: "Proyecto no encontrado." });
    }

    return response.json(project);
  });

  // Elimina un proyecto y devuelve la información anterior como confirmación.
  app.delete("/api/projects/:id", (request, response) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return response.status(400).json({ error: "El identificador del proyecto no es válido." });
    }

    const project = services.deleteProject(id);
    if (!project) {
      return response.status(404).json({ error: "Proyecto no encontrado." });
    }

    return response.json({ message: "Proyecto eliminado correctamente.", project });
  });

  app.get(["/", "/index.html"], (request, response) => {
    response.sendFile(path.join(__dirname, "..", "..", "frontend", "index.html"));
  });

  for (const directory of ["assets", "js", "css"]) {
    app.use(`/${directory}`, express.static(path.join(__dirname, "..", "..", "frontend", directory)));
  }

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }
    if (error.type === "entity.too.large") {
      return response.status(413).json({ error: "La solicitud es demasiado grande." });
    }
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({ error: "El formato de los datos enviados no es válido." });
    }

    console.error("Error al procesar la solicitud:", error);
    return response.status(500).json({ error: "Ocurrió un error interno." });
  });

  return app;
}

module.exports = { createApp };
