const { test, expect } = require('@jest/globals');
const request = require('supertest');
const app = require('../src/app');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Paso 4: Paginación y ordenación', () => {
  let connection;
  const testNews = [];

  beforeAll(async () => {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Crear datos de prueba
    const noticias = [
      {
        titulo: 'Noticia 1',
        descripcion: 'Descripción 1',
        published_at: '2024-01-01 10:00:00'
      },
      {
        titulo: 'Noticia 2',
        descripcion: 'Descripción 2',
        published_at: '2024-01-02 10:00:00'
      },
      {
        titulo: 'Noticia 3',
        descripcion: 'Descripción 3',
        published_at: '2024-01-03 10:00:00'
      }
    ];

    for (const noticia of noticias) {
      const [result] = await connection.query(
        'INSERT INTO news (titulo, descripcion, published_at) VALUES (?, ?, ?)',
        [noticia.titulo, noticia.descripcion, noticia.published_at]
      );
      testNews.push(result.insertId);
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testNews.length > 0) {
      await connection.query('DELETE FROM news WHERE id IN (?)', [testNews]);
    }
    await connection.end();
  });

  test('Obtener noticias con paginación por defecto', async () => {
    const response = await request(app)
      .get('/api/v1/news')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page', 1);
    expect(response.body.pagination).toHaveProperty('limit', 10);
    expect(response.body.data.length).toBeLessThanOrEqual(10);
  });

  test('Obtener noticias con paginación personalizada', async () => {
    const response = await request(app)
      .get('/api/v1/news?page=1&limit=2')
      .expect(200);

    expect(response.body.data.length).toBe(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
  });

  test('Obtener noticias ordenadas por fecha de publicación (descendente)', async () => {
    const response = await request(app)
      .get('/api/v1/news?sort=published_at&order=desc')
      .expect(200);

    const fechas = response.body.data.map(n => new Date(n.published_at));
    for (let i = 0; i < fechas.length - 1; i++) {
      expect(fechas[i]).toBeGreaterThanOrEqual(fechas[i + 1]);
    }
  });

  test('Obtener noticias ordenadas por fecha de publicación (ascendente)', async () => {
    const response = await request(app)
      .get('/api/v1/news?sort=published_at&order=asc')
      .expect(200);

    const fechas = response.body.data.map(n => new Date(n.published_at));
    for (let i = 0; i < fechas.length - 1; i++) {
      expect(fechas[i]).toBeLessThanOrEqual(fechas[i + 1]);
    }
  });
}); 