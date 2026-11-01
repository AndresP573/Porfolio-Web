// Actualiza el año del footer y selecciona los elementos clave del DOM.
const anioActual = document.querySelector("#anio-actual");
const formulario = document.querySelector("#contacto form");
const estadoFormulario = document.querySelector("#estado-formulario");
const proyectosLista = document.querySelector("#proyectos-lista");
const proyectoForm = document.querySelector("#proyecto-form");
const proyectoEstado = document.querySelector("#proyecto-estado");
const cancelarEdicionBtn = document.querySelector("#cancelar-edicion");

if (anioActual) {
  anioActual.textContent = new Date().getFullYear();
}

if (formulario && estadoFormulario) {
  const nombreInput = formulario.elements.namedItem("nombre");
  const correoInput = formulario.elements.namedItem("correo");
  const mensajeInput = formulario.elements.namedItem("mensaje");

  const limpiarEstado = () => {
    estadoFormulario.textContent = "";
  };

  const mostrarError = (mensaje, elemento) => {
    estadoFormulario.textContent = mensaje;
    if (elemento) {
      elemento.focus();
    }
  };

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombre = nombreInput ? nombreInput.value.trim() : "";
    const correo = correoInput ? correoInput.value.trim() : "";
    const mensaje = mensajeInput ? mensajeInput.value.trim() : "";

    if (!nombre) {
      mostrarError("Escribe tu nombre para continuar.", nombreInput);
      return;
    }
    if (!correo) {
      mostrarError("Escribe tu correo para continuar.", correoInput);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      mostrarError("Escribe un correo valido.", correoInput);
      return;
    }
    if (!mensaje) {
      mostrarError("Escribe un mensaje para continuar.", mensajeInput);
      return;
    }

    const botonEnvio = formulario.querySelector('button[type="submit"]');
    if (botonEnvio) {
      botonEnvio.disabled = true;
    }
    estadoFormulario.textContent = "Enviando mensaje...";

    try {
      const respuesta = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, mensaje }),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        estadoFormulario.textContent = resultado.error || "No se pudo guardar el mensaje.";
        return;
      }

      formulario.reset();
      estadoFormulario.textContent = "Tu mensaje se guardó correctamente.";
    } catch (error) {
      console.error("No se pudo enviar el mensaje de contacto:", error);
      estadoFormulario.textContent = "No se pudo conectar con el servidor. Inténtalo nuevamente.";
    } finally {
      if (botonEnvio) {
        botonEnvio.disabled = false;
      }
    }
  });

  formulario.addEventListener("input", limpiarEstado);
  formulario.addEventListener("change", limpiarEstado);
}

// Solicita los proyectos al backend y los dibuja en la sección correspondiente.
async function cargarProyectos() {
  if (!proyectosLista) return;

  try {
    const respuesta = await fetch("/api/projects");
    if (!respuesta.ok) {
      throw new Error("Error al cargar proyectos");
    }

    const proyectos = await respuesta.json();
    renderProyectos(proyectos);
  } catch (error) {
    console.error(error);
    proyectosLista.innerHTML = '<p class="proyectos-vacio">No se pudieron cargar los proyectos.</p>';
  }
}

// Genera las tarjetas de los proyectos en el HTML para que el usuario pueda verlos.
function renderProyectos(proyectos) {
  if (!proyectosLista) return;

  if (!Array.isArray(proyectos) || proyectos.length === 0) {
    proyectosLista.innerHTML = '<p class="proyectos-vacio">Aún no hay proyectos guardados.</p>';
    return;
  }

  proyectosLista.innerHTML = proyectos.map((proyecto) => `
    <article class="proyecto" data-id="${proyecto.id}">
      <div class="proyecto-imagen-wrap">
        <img src="${proyecto.image}" alt="${proyecto.name}" loading="lazy">
      </div>
      <div class="proyecto-content">
        <div class="proyecto-meta">
          <h3>${proyecto.name}</h3>
          <span class="badge">${proyecto.status}</span>
        </div>
        <p>${proyecto.description}</p>
        <ul class="tecnologias">
          ${proyecto.technologies.map((tec) => `<li>${tec}</li>`).join("")}
        </ul>
        <div class="proyecto-acciones">
          <button type="button" class="editar" data-id="${proyecto.id}">Editar</button>
          <button type="button" class="eliminar" data-id="${proyecto.id}">Eliminar</button>
        </div>
      </div>
    </article>
  `).join("");

  proyectosLista.querySelectorAll(".editar").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const id = Number(boton.dataset.id);
      if (!id) return;
      await cargarProyectoParaEditar(id);
    });
  });

  proyectosLista.querySelectorAll(".eliminar").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const id = Number(boton.dataset.id);
      if (!id) return;
      await eliminarProyecto(id);
    });
  });
}

async function cargarProyectoParaEditar(id) {
  try {
    const respuesta = await fetch(`/api/projects`);
    if (!respuesta.ok) throw new Error("No se pudo recuperar el proyecto");
    const proyectos = await respuesta.json();
    const proyecto = proyectos.find((item) => Number(item.id) === id);

    if (!proyecto || !proyectoForm) return;

    const nombreInput = proyectoForm.elements.namedItem("name");
    const descripcionInput = proyectoForm.elements.namedItem("description");
    const tecnologiasInput = proyectoForm.elements.namedItem("technologies");
    const imageInput = proyectoForm.elements.namedItem("image");
    const statusInput = proyectoForm.elements.namedItem("status");

    if (nombreInput) nombreInput.value = proyecto.name;
    if (descripcionInput) descripcionInput.value = proyecto.description;
    if (tecnologiasInput) tecnologiasInput.value = proyecto.technologies.join(", ");
    if (imageInput) imageInput.value = proyecto.image;
    if (statusInput) statusInput.value = proyecto.status;

    proyectoForm.dataset.editingId = String(id);
    proyectoEstado.textContent = "Editando proyecto...";
    if (cancelarEdicionBtn) cancelarEdicionBtn.hidden = false;
    proyectoForm.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error(error);
    if (proyectoEstado) proyectoEstado.textContent = "No se pudo cargar el proyecto para editar.";
  }
}

async function eliminarProyecto(id) {
  try {
    const respuesta = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar");
    }
    proyectoEstado.textContent = resultado.message || "Proyecto eliminado.";
    await cargarProyectos();
  } catch (error) {
    console.error(error);
    proyectoEstado.textContent = error.message || "No se pudo eliminar el proyecto.";
  }
}

if (proyectoForm) {
  proyectoForm.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const formData = new FormData(proyectoForm);
    const nombre = String(formData.get("name") || "").trim();
    const descripcion = String(formData.get("description") || "").trim();
    const tecnologias = String(formData.get("technologies") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const imagen = String(formData.get("image") || "").trim();
    const estado = String(formData.get("status") || "Publicado").trim();

    if (!nombre || !descripcion || tecnologias.length === 0 || !imagen) {
      proyectoEstado.textContent = "Completa todos los campos para guardar el proyecto.";
      return;
    }

    const payload = {
      name: nombre,
      description: descripcion,
      technologies: tecnologias,
      image: imagen,
      status: estado,
    };

    try {
      const editingId = proyectoForm.dataset.editingId;
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/projects/${editingId}` : "/api/projects";

      const respuesta = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar el proyecto.");
      }

      proyectoForm.reset();
      delete proyectoForm.dataset.editingId;
      if (cancelarEdicionBtn) cancelarEdicionBtn.hidden = true;
      proyectoEstado.textContent = editingId ? "Proyecto actualizado correctamente." : "Proyecto guardado correctamente.";
      await cargarProyectos();
    } catch (error) {
      console.error(error);
      proyectoEstado.textContent = error.message || "No se pudo guardar el proyecto.";
    }
  });
}

if (cancelarEdicionBtn && proyectoForm) {
  cancelarEdicionBtn.addEventListener("click", () => {
    proyectoForm.reset();
    delete proyectoForm.dataset.editingId;
    cancelarEdicionBtn.hidden = true;
    proyectoEstado.textContent = "Edición cancelada.";
  });
}

if (proyectosLista) {
  cargarProyectos();
}
