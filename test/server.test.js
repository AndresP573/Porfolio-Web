const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { createServer } = require("node:http");
const { createApp, createDatabase } = require("../server");

const database = createDatabase(":memory:");
const server = createServer(createApp(database));

after(async () => {
	await new Promise((resolve, reject) => {
		server.close((error) => error ? reject(error) : resolve());
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
			mensaje: "Quiero conversar sobre un proyecto."
		})
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
			mensaje: "Mensaje"
		})
	});

	assert.equal(response.status, 400);
	assert.equal(database.prepare("SELECT COUNT(*) AS count FROM contact_messages").get().count, 1);
});
