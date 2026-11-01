function normalizeProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    technologies: Array.isArray(row.technologies)
      ? row.technologies
      : JSON.parse(row.technologies || "[]"),
    image: row.image,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeProjectInput(input = {}) {
  const name = typeof input.name === "string" ? input.name.trim() : (typeof input.nombre === "string" ? input.nombre.trim() : "");
  const description = typeof input.description === "string" ? input.description.trim() : (typeof input.descripcion === "string" ? input.descripcion.trim() : "");
  const rawTechnologies = input.technologies ?? input.tecnologias ?? [];
  const technologies = Array.isArray(rawTechnologies)
    ? rawTechnologies.map((tech) => String(tech).trim()).filter(Boolean)
    : String(rawTechnologies)
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean);
  const image = typeof input.image === "string" ? input.image.trim() : (typeof input.imagen === "string" ? input.imagen.trim() : "");
  const status = typeof input.status === "string" ? input.status.trim() : (typeof input.estado === "string" ? input.estado.trim() : "");

  return { name, description, technologies, image, status };
}

module.exports = { normalizeProject, normalizeProjectInput };
