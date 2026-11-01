const { normalizeProject } = require("./projectUtils");

// Encapsula la lógica de acceso a la base de datos para gestionar los proyectos.
// Esto permite que los endpoints del servidor no dependan directamente de SQL.
function projectService(database) {
  // Obtiene todos los proyectos ordenados por fecha de creación más reciente.
  const listProjects = () => {
    const rows = database.prepare(
      "SELECT id, name, description, technologies, image, status, created_at, updated_at FROM projects ORDER BY id DESC"
    ).all();

    return rows.map((row) => normalizeProject(row));
  };

  // Recupera un proyecto en particular por su identificador.
  const getProjectById = (id) => {
    const row = database.prepare(
      "SELECT id, name, description, technologies, image, status, created_at, updated_at FROM projects WHERE id = ?"
    ).get(id);

    return row ? normalizeProject(row) : null;
  };

  // Crea un registro nuevo y devuelve el proyecto ya persistido.
  const createProject = (projectData) => {
    const result = database.prepare(
      "INSERT INTO projects (name, description, technologies, image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    ).run(
      projectData.name,
      projectData.description,
      JSON.stringify(projectData.technologies),
      projectData.image,
      projectData.status
    );

    return getProjectById(result.lastInsertRowid);
  };

  // Actualiza un proyecto existente conservando valores actuales si no se envían nuevos.
  const updateProject = (id, projectData) => {
    const current = getProjectById(id);
    if (!current) {
      return null;
    }

    const next = {
      name: projectData.name ?? current.name,
      description: projectData.description ?? current.description,
      technologies: projectData.technologies ?? current.technologies,
      image: projectData.image ?? current.image,
      status: projectData.status ?? current.status,
    };

    database.prepare(
      "UPDATE projects SET name = ?, description = ?, technologies = ?, image = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(
      next.name,
      next.description,
      JSON.stringify(next.technologies),
      next.image,
      next.status,
      id
    );

    return getProjectById(id);
  };

  // Elimina un proyecto por id y devuelve la versión borrada para confirmar la operación.
  const deleteProject = (id) => {
    const project = getProjectById(id);
    if (!project) {
      return null;
    }

    database.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return project;
  };

  return {
    listProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
  };
}

module.exports = { projectService };
