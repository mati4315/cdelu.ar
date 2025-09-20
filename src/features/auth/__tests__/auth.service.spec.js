const service = require('../auth.service');

// Mocks del repositorio
jest.mock('../auth.repository', () => ({
  emailExists: jest.fn(),
  insertUser: jest.fn(),
  findUserById: jest.fn(),
  findUserByEmail: jest.fn(),
  otherUserHasEmail: jest.fn(),
  updateUserProfile: jest.fn(),
}));

const repo = require('../auth.repository');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerUser retorna EMAIL_IN_USE si el email existe', async () => {
    repo.emailExists.mockResolvedValue(true);
    const res = await service.registerUser({ nombre: 'Test', email: 't@e.com', password: 'secret', rol: 'usuario' });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('EMAIL_IN_USE');
  });

  it('registerUser crea usuario y retorna user', async () => {
    repo.emailExists.mockResolvedValue(false);
    repo.insertUser.mockResolvedValue(1);
    repo.findUserById.mockResolvedValue({ id: 1, nombre: 'Test', email: 't@e.com', rol: 'usuario' });
    const res = await service.registerUser({ nombre: 'Test', email: 't@e.com', password: 'secret', rol: 'usuario' });
    expect(res.ok).toBe(true);
    expect(res.user).toMatchObject({ id: 1, email: 't@e.com' });
  });

  it('authenticateUser falla con credenciales inválidas', async () => {
    repo.findUserByEmail.mockResolvedValue(null);
    const res = await service.authenticateUser({ email: 'a@b.com', password: 'x' });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_CREDENTIALS');
  });

  it('updateProfile valida email en uso', async () => {
    repo.otherUserHasEmail.mockResolvedValue(true);
    const res = await service.updateProfile(1, { nombre: 'Nuevo', email: 'dup@e.com' });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('EMAIL_IN_USE');
  });
});


