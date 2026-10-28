/* Seleccionar el elemento con el id ="" y asignarlo a su variable */
const anioActual = document.querySelector("#anio-actual");
const formulario = document.querySelector("#contacto form");
const estadoFormulario = document.querySelector("#estado-formulario");

if (anioActual) {/* Verifica si el elemento con el id "anio-actual" existe antes de intentar acceder a el */
	anioActual.textContent = new Date().getFullYear();
}
/* Verifica si el formulario y el estado del formulario existen antes de intentar acceder a ellos y se asigna a la variable con su Input */
if (formulario && estadoFormulario) {
	const nombreInput = formulario.elements.namedItem("nombre");
	const correoInput = formulario.elements.namedItem("correo");
	const mensajeInput = formulario.elements.namedItem("mensaje");
/* limpia el estado del formulario y eliminar cualquier mensaje de error */
	const limpiarEstado = () => {
		estadoFormulario.textContent = "";
	};
/* Se enfoca en mostrar el error y muestra el elemento que tiene el error */
	const mostrarError = (mensaje, elemento) => {
		estadoFormulario.textContent = mensaje;
		if (elemento) {
			elemento.focus();
		}
	};
/* Agrega un evento al formulario que se ejecuta cuando se envía el formulario */
	formulario.addEventListener("submit", async (evento) => {
		evento.preventDefault();
/* Obtener el valor del elemento del Input correspondiente y eliminar los espacios en blanco al inicio y al final */
		const nombre = nombreInput ? nombreInput.value.trim() : "";
		const correo = correoInput ? correoInput.value.trim() : "";
		const mensaje = mensajeInput ? mensajeInput.value.trim() : "";
/* Verifica si el valor del elemento nombreInput esta vacio */
		if (!nombre) {
			mostrarError("Escribe tu nombre para continuar.", nombreInput);
			return;
		}
/* Verifica si el valor del elemento correoInput esta vacio */
		if (!correo) {
			mostrarError("Escribe tu correo para continuar.", correoInput);
			return;
		}
/* Verifica si el valor del elemento correoInput es un correo valido usando una expresion regular */
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
			mostrarError("Escribe un correo valido.", correoInput);
			return;
		}
/* Verifica si el valor del elemento mensajeInput esta vacio */
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
				body: JSON.stringify({ nombre, correo, mensaje })
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
/* Agrega un evento al formulario que se ejecuta cuando se ingresa un valor en cualquier elemento del formulario y llama a la funcion limpiarEstado */
	formulario.addEventListener("input", limpiarEstado);
	formulario.addEventListener("change", limpiarEstado);
}
