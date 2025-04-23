const { test, expect } = require('@jest/globals');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Paso 1: Configuración del entorno', () => {
  test('Las variables de entorno están configuradas correctamente', () => {
    // Verificar que las variables de entorno requeridas existen
    expect(process.env.PORT).toBeDefined();
    expect(process.env.DB_HOST).toBeDefined();
    expect(process.env.DB_USER).toBeDefined();
    expect(process.env.DB_PASSWORD).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.DEEPSEEK_API_KEY).toBeDefined();
    expect(process.env.RSS_FEED_URL).toBeDefined();
  });

  test('Las variables de entorno tienen valores válidos', () => {
    // Verificar que los valores no están vacíos
    expect(process.env.PORT).not.toBe('');
    expect(process.env.DB_HOST).not.toBe('');
    expect(process.env.DB_USER).not.toBe('');
    expect(process.env.DB_PASSWORD).not.toBe('');
    expect(process.env.DB_NAME).not.toBe('');
    expect(process.env.DEEPSEEK_API_KEY).not.toBe('');
    expect(process.env.RSS_FEED_URL).not.toBe('');

    // Verificar tipos de datos
    expect(Number(process.env.PORT)).not.toBeNaN();
    expect(process.env.RSS_FEED_URL).toMatch(/^https?:\/\/.+/);
  });
}); 