# Sistema Matriz de Riesgos

Proyecto desarrollado con **React 19**, **Vite**, **Tailwind CSS v4** y arquitectura preparada para **Base de Datos / API REST (localhost:3000)**.

---

## 🚀 Comandos Disponibles

- **Iniciar aplicación frontend (Vite)**:
  ```bash
  npm run dev
  ```
- **Iniciar servidor backend de prueba (localhost:3000)**:
  ```bash
  npm run server
  ```
- **Compilar para producción**:
  ```bash
  npm run build
  ```
- **Verificar linter**:
  ```bash
  npm run lint
  ```

---

## 🔐 Usuarios y Credenciales de Prueba

En la pantalla de login puedes hacer clic en cualquiera de los usuarios preconfigurados o escribir manualmente:

| Nombre | Correo Electrónico | Contraseña | Rol / Permisos |
| :--- | :--- | :--- | :--- |
| **Carlos Mendoza** | `admin@matrizriesgos.com` | `admin123` | Administrador de Riesgos |
| **Valeria Restrepo** | `auditor@matrizriesgos.com` | `auditor123` | Auditor de Control Interno |
| **Rodrigo Peña** | `operador@matrizriesgos.com` | `operador123` | Oficial de Riesgos Operativos |

---

## 🔌 Conexión a Base de Datos (localhost:3000)

El frontend está configurado mediante variables de entorno en `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### Contrato de API preparado:
1. `GET /api/health` -> Comprobación de estado del servidor
2. `POST /api/auth/login` -> Autenticación con BD (`{ email, password }` -> `{ token, user }`)
3. `GET /api/risks` -> Obtener listado de riesgos
4. `POST /api/risks` -> Crear nuevo riesgo
5. `DELETE /api/risks/:id` -> Eliminar riesgo

> **Nota:** Si el servidor backend en `localhost:3000` está apagado, el frontend funciona de forma automática en **Modo Simulado / Offline** con datos de prueba locales y persistencia en `localStorage`, sin bloquear el desarrollo.

---

## 🍔 Sidebar de Tipo Hamburguesa

- Accesible mediante el botón de menú hamburguesa (☰) en la barra de navegación superior.
- Despliegue lateral con animaciones fluidas, cierre por clic en fondo oscuro o tecla `Escape`.
- Resumen del perfil de usuario activo (avatar, nombre, rol, email y modo de conexión).
- Navegación entre vistas:
  - **Matriz y Tratamiento** (`MatrizVisualizacion.jsx`): Tabla integral con Identificación, Evaluación, Fecha de Análisis y la sección de Tratamiento del Riesgo (Plan de Acción, Mitigación, Nueva Probabilidad, Nuevo Impacto, Nuevo Nivel de Riesgo y Fecha de Tratamiento). Permite agregar, editar y eliminar interactivamente.
  - **Identificación y Evaluación** (`RiesgosVisualizacion.jsx`): Tabla seccionada en 2 bloques normativos con los 5 riesgos de prueba.
  - **Dashboard General**: Métricas globales, Matriz 5x5 y tabla.
  - **Matriz de Calor 5x5**: Vista enfocada del mapa de calor.
  - **Inventario de Riesgos**: Tabla completa con filtros por categoría y buscador.
  - **Conexión BD**: Monitor en tiempo real del estado de `localhost:3000` y documentación de endpoints.
- Botón de **Cerrar Sesión**.

---

## 📁 Estructura del Proyecto

```text
src/
├── assets/             # Recursos estáticos (logos e iconos)
├── components/         # Componentes modulares
│   ├── layout/         # Componentes globales (Navbar con hamburguesa, Sidebar drawer, Footer)
│   ├── matrix/         # Matriz 5x5 (Heatmap, RiskTable, NewRiskModal)
│   └── ui/             # Componentes atómicos (Button, Badge, Card)
├── constants/          # Escalas de probabilidad, impacto y niveles de severidad
├── context/            # Proveedores de estado (AuthContext, RiskContext)
├── data/               # Datos simulados iniciales (mockRisks)
├── hooks/              # Custom Hooks (useAuth, useRisks, useRiskContext)
├── pages/              # Vistas principales (LoginPage, Dashboard, DatabaseStatusPage)
├── services/           # Clientes HTTP y lógica de datos (api.js, authService.js, riskService.js)
├── utils/              # Cálculos matemáticos y utilidades (matriz P x I)
├── App.jsx             # Punto de unión de autenticación, sidebar y vistas
├── index.css           # Estilos globales y Tailwind CSS v4
└── main.jsx            # Punto de entrada de React
```
