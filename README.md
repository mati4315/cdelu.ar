Crear noticias

npm run import-news

1. Estructura de carpetas
Cdelu.ar/
├── src/
│   ├── controllers/         # Lógica de negocio (noticias, usuarios, RSS…)
│   ├── models/              # Definición de esquemas y consultas MySQL
│   ├── routes/              # Rutas Fastify por recurso
│   ├── services/            # Integración con DeepSeek y RSS
│   ├── middlewares/         # Autenticación, roles, paginación
│   └── index.js             # Punto de entrada Fastify
├── config/
│   ├── default.js           # Configuración general (puertos, etc.)
│   └── database.js          # Conexión y pooling MySQL
├── public/
│   └── dashboard.html       # Interfaz interna para administrador
├── tests/                   # Test unitarios e integración
│   ├── news.test.js
│   ├── users.test.js
│   └── …
├── .env.example             # Ejemplo de variables de entorno
├── package.json
└── README.md



2. Esquema básico de base de datos
-- Roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Usuarios
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Noticias
CREATE TABLE news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  resumen TEXT,                 -- generado por DeepSeek
  image_url VARCHAR(500),
  original_url VARCHAR(500),
  published_at DATETIME,        -- fecha de la noticia RSS u oficial
  is_oficial BOOLEAN DEFAULT TRUE,
  created_by INT,               -- id de usuario que la creó
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Likes
CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  news_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (news_id) REFERENCES news(id)
);

-- Comentarios
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  news_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (news_id) REFERENCES news(id)
);

-- Inserción del rol y usuario administrador
INSERT INTO roles (nombre) VALUES ('administrador'), ('colaborador'), ('usuario');

INSERT INTO users (nombre, email, password, role_id)
VALUES (
  'Matias Moreira',
  'matias4315@gmail.com',
  /* aquí iría el hash de 'w35115415' */,
  (SELECT id FROM roles WHERE nombre='administrador')
);





3. # Cdelu.ar

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)  
[![Licencia](https://img.shields.io/badge/license-MIT-blue)](#)  
[![Versión](https://img.shields.io/badge/version-0.1.0-yellow)](#)

API REST para un diario online con Fastify y MySQL.

---

## 📖 Contenido
- [Acerca de](#acerca-de)  
- [Características](#caracter%C3%ADsticas)  
- [Instalación](#instalaci%C3%B3n)  
- [Uso](#uso)  
- [Configuración](#configuraci%C3%B3n)  
- [Estructura del Proyecto](#estructura-del-proyecto)  
- [Esquema de Base de Datos](#esquema-de-base-de-datos)  
- [Roadmap](#roadmap)  
- [Contribuir](#contribuir)  
- [Licencia](#licencia)  
- [Autores y Agradecimientos](#autores-y-agradecimientos)  
- [Soporte](#soporte)

---

## 🧐 Acerca de
Cdelu.ar es un diario online que extrae automáticamente noticias desde un feed RSS (`https://lapiramide.net/feed`) y permite además a los usuarios crear «noticias no oficiales».  
La API está construida con Fastify para maximizar el rendimiento y utiliza MySQL optimizado para consultas rápidas.

---

## ✨ Características
- **API REST** con Fastify y MySQL altamente optimizada  
- **Paginación**: muestra 10 noticias por página  
- **Ordenación** por fecha de publicación  
- **Feed RSS**: importación automática de la última noticia  
- **Generación de contenido IA**:
  - Nuevo título a partir de la descripción original  
  - Resumen automático usando `DEEPSEEK_API_KEY`  
- **Gestión de usuarios** con 3 roles: administrador, colaboradores y usuarios  
- **Interacción**: likes y comentarios sobre noticias  
- **Dashboard** (solo admin) con métricas y gestión de noticias  

---

## 🚀 Instalación
### Requisitos
- Node.js ≥14  
- MySQL 8+  

### Pasos
```bash
git clone https://github.com/tuusuario/Cdelu.ar.git
cd Cdelu.ar
npm install






⚙️ Configuración
Copia y renombra .env.example a .env


PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cdelu_db
DEEPSEEK_API_KEY=sk-9cf6c2f6d50a46f1a28c7aa1c6920332
RSS_FEED_URL=https://lapiramide.net/feed
