const anioActual = document.querySelector("#anio-actual");/* Esto sirve para seleccionar el elemento con el id "anio-actual" y asignarlo a la variable anioActual */
const formulario = document.querySelector("#contacto form");/* Esto sirve para seleccionar el formulario dentro del elemento con el id "contacto" y asignarlo a la variable formulario */
const estadoFormulario = document.querySelector("#estado-formulario");/* Esto sirve para seleccionar el elemento con el id "estado-formulario" y asignarlo a la variable estadoFormulario */

if (anioActual) {/* Esto sirve para verificar si el elemento con el id "anio-actual" existe antes de intentar acceder a el */
	anioActual.textContent = new Date().getFullYear();
}

if (formulario && estadoFormulario) {/* Esto sirve para verificar si el formulario y el estado del formulario existen antes de intentar acceder a ellos */
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

	formulario.addEventListener("submit", (evento) => {
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

		estadoFormulario.textContent = `Formulario validado para ${nombre}. Aun falta conectarlo a un servicio de envio.`;
	});

	formulario.addEventListener("input", limpiarEstado);
	formulario.addEventListener("change", limpiarEstado);
}
