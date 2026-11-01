const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { createServer } = require("node:http");
const { projectService } = require("../backend/src/projectService");
const { createDatabase } = require("../backend/src/database");
const { createApp } = require("../backend/src/app");

const database = createDatabase(":memory:");
const services = projectService(database);
const server = createServer(createApp(database, { projectService: services }));

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  database.close();
});

test("serves the portfolio and stores valid contact messages", async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const pageResponse = await fetch(baseUrl);
  assert.equal(pageResponse.status, 200);
  assert.match(await pageResponse.text(), /Mi portfolio/);

  const response = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: "Ana",
      correo: "ana@example.com",
      mensaje: "Quiero conversar sobre un proyecto.",
    }),
  });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).message, "Tu mensaje se guardó correctamente.");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM contact_messages").get().count, 1);
});

test("rejects invalid contact data without saving it", async () => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: "   ",
      correo: "no-es-un-correo",
      mensaje: "Mensaje",
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM contact_messages").get().count, 1);
});

test("creates, lists, updates and deletes projects", async () => {
  const createResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "VitalHome",
      description: "Aplicación para el cuidado de adultos mayores.",
      technologies: ["Node.js", "React Native"],
      image: "https://example.com/vitalhome.png",
      status: "Publicado",
    }),
  });

  assert.equal(createResponse.status, 201);
  const createdProject = await createResponse.json();
  assert.equal(createdProject.name, "VitalHome");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM projects").get().count, 1);

  const listResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/projects`);
  assert.equal(listResponse.status, 200);
  const projects = await listResponse.json();
  assert.equal(projects.length, 1);

  const updateResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/projects/${createdProject.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "En desarrollo",
      description: "Actualizado",
    }),
  });
  assert.equal(updateResponse.status, 200);
  const updatedProject = await updateResponse.json();
  assert.equal(updatedProject.status, "En desarrollo");

  const deleteResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/projects/${createdProject.id}`, {
    method: "DELETE",
  });
  assert.equal(deleteResponse.status, 200);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM projects").get().count, 0);
});
