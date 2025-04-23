const { test, expect } = require('@jest/globals');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Paso 2: Configuración de conexión MySQL', () => {
  let connection;

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
    // Cerrar conexión
    if (connection) {
      await connection.end();
    }
  });

  test('La conexión a MySQL se establece correctamente', async () => {
    // Verificar que la conexión está activa
    const [rows] = await connection.query('SELECT 1');
    expect(rows[0]['1']).toBe(1);
  });

  test('Las tablas necesarias existen en la base de datos', async () => {
    // Verificar existencia de tablas
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    const tableNames = tables.map(table => table.TABLE_NAME);
    
    expect(tableNames).toContain('roles');
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('news');
    expect(tableNames).toContain('likes');
    expect(tableNames).toContain('comments');
  });

  test('El rol de administrador existe en la base de datos', async () => {
    const [roles] = await connection.query(
      'SELECT * FROM roles WHERE nombre = ?',
      ['administrador']
    );
    
    expect(roles.length).toBe(1);
    expect(roles[0].nombre).toBe('administrador');
  });
}); 