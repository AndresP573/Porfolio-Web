# Portfolio Web con backend y CRUD de proyectos

Este proyecto mantiene el portfolio personal y agrega una capa backend con Node.js + Express para gestionar proyectos desde una base de datos SQLite.

## Estructura del proyecto

```text
portfolio-web/
├── backend/
│   └── src/
│       ├── app.js
│       ├── database.js
│       ├── projectService.js
│       ├── projectUtils.js
│       └── types.ts
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── assets/
├── test/
│   └── server.test.js
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Requisitos

- Node.js 22.13 o superior
- npm

## Instalación

```bash
npm install
```

## Ejecutar el proyecto

```bash
npm start
```

La aplicación queda disponible en:

```text
http://localhost:3000
```

## Funcionalidades

- Sección de contacto con validación del formulario.
- Backend con endpoints para gestionar mensajes de contacto y proyectos.
- Persistencia con SQLite.
- CRUD de proyectos:
  - GET /api/projects
  - POST /api/projects
  - PUT /api/projects/:id
  - DELETE /api/projects/:id
- Frontend con formulario para crear/editar proyectos.

## Base de datos

La aplicación usa SQLite y crea automáticamente la base de datos en:

```text
.data/portfolio.sqlite
```

## Pruebas

```bash
node --test
```
