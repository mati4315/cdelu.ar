const { test, expect } = require('@jest/globals');
const request = require('supertest');
const app = require('../src/app');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const Parser = require('rss-parser');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Paso 5: Integración RSS y DeepSeek', () => {
  let connection;
  let parser;

  beforeAll(async () => {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    parser = new Parser();
  });

  afterAll(async () => {
    await connection.end();
  });

  test('El feed RSS es accesible y válido', async () => {
    const feed = await parser.parseURL(process.env.RSS_FEED_URL);
    
    expect(feed).toBeDefined();
    expect(feed.items).toBeDefined();
    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items[0]).toHaveProperty('title');
    expect(feed.items[0]).toHaveProperty('content');
  });

  test('Importar noticia desde RSS', async () => {
    const response = await request(app)
      .post('/api/v1/news/import-rss')
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('titulo');
    expect(response.body).toHaveProperty('descripcion');
    expect(response.body).toHaveProperty('resumen');
    expect(response.body.is_oficial).toBe(true);
  });

  test('Generar resumen con DeepSeek', async () => {
    const texto = 'Este es un texto de prueba para generar un resumen. ' +
      'El resumen debería ser más corto que el texto original y capturar ' +
      'las ideas principales del contenido.';

    const response = await request(app)
      .post('/api/v1/news/generate-summary')
      .send({ text: texto })
      .expect(200);

    expect(response.body).toHaveProperty('summary');
    expect(response.body.summary.length).toBeLessThan(texto.length);
    expect(response.body.summary).toMatch(/[a-zA-Z]/);
  });

  test('Generar título alternativo con DeepSeek', async () => {
    const texto = 'El presidente anunció nuevas medidas económicas para ' +
      'estimular el crecimiento del país durante la próxima década.';

    const response = await request(app)
      .post('/api/v1/news/generate-title')
      .send({ text: texto })
      .expect(200);

    expect(response.body).toHaveProperty('title');
    expect(response.body.title.length).toBeGreaterThan(0);
    expect(response.body.title).toMatch(/[a-zA-Z]/);
  });
}); 