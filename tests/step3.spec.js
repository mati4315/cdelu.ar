const { test, expect } = require('@jest/globals');
const request = require('supertest');
const app = require('../src/app');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Paso 3: CRUD de noticias básicas', () => {
  let connection;
  let testNewsId;

  beforeAll(async () => {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testNewsId) {
      await connection.query('DELETE FROM news WHERE id = ?', [testNewsId]);
    }
    await connection.end();
  });

  test('Crear una nueva noticia', async () => {
    const nuevaNoticia = {
      titulo: 'Test Noticia',
      descripcion: 'Esta es una noticia de prueba',
      image_url: 'https://example.com/image.jpg',
      original_url: 'https://example.com',
      is_oficial: true
    };

    const response = await request(app)
      .post('/api/v1/news')
      .send(nuevaNoticia)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe(nuevaNoticia.titulo);
    expect(response.body.descripcion).toBe(nuevaNoticia.descripcion);
    
    testNewsId = response.body.id;
  });

  test('Obtener una noticia por ID', async () => {
    const response = await request(app)
      .get(`/api/v1/news/${testNewsId}`)
      .expect(200);

    expect(response.body.id).toBe(testNewsId);
    expect(response.body.titulo).toBe('Test Noticia');
  });

  test('Actualizar una noticia', async () => {
    const actualizacion = {
      titulo: 'Noticia Actualizada',
      descripcion: 'Descripción actualizada'
    };

    const response = await request(app)
      .put(`/api/v1/news/${testNewsId}`)
      .send(actualizacion)
      .expect(200);

    expect(response.body.titulo).toBe(actualizacion.titulo);
    expect(response.body.descripcion).toBe(actualizacion.descripcion);
  });

  test('Eliminar una noticia', async () => {
    await request(app)
      .delete(`/api/v1/news/${testNewsId}`)
      .expect(204);

    // Verificar que la noticia ya no existe
    const [rows] = await connection.query(
      'SELECT * FROM news WHERE id = ?',
      [testNewsId]
    );
    expect(rows.length).toBe(0);
  });
}); 