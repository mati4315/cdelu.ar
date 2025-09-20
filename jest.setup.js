// Evitar llamadas reales a servicios externos durante tests
jest.mock('./src/services/aiService', () => ({
  generateSummary: jest.fn().mockResolvedValue('resumen mock'),
  generateTitle: jest.fn().mockResolvedValue('titulo mock'),
}));


