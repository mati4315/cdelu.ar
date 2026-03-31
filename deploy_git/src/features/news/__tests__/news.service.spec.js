const service = require('../news.service');

jest.mock('../news.repository', () => ({
  fetchNewsList: jest.fn(),
  fetchNewsTotalCount: jest.fn(),
  fetchNewsById: jest.fn(),
  insertNews: jest.fn(),
  updateNewsById: jest.fn(),
  deleteNewsById: jest.fn(),
  existsLike: jest.fn(),
  createLike: jest.fn(),
  deleteLike: jest.fn(),
  fetchComments: jest.fn(),
  createComment: jest.fn(),
}));

const repo = require('../news.repository');

describe('NewsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listNews retorna paginado correcto', async () => {
    repo.fetchNewsList.mockResolvedValue([{ id: 1 }]);
    repo.fetchNewsTotalCount.mockResolvedValue(11);
    const res = await service.listNews({ page: 2, limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(res.pagination.total).toBe(11);
    expect(res.pagination.totalPages).toBe(2);
  });

  it('addLike evita duplicados', async () => {
    repo.existsLike.mockResolvedValue(true);
    const ok = await service.addLike(1, 1);
    expect(ok).toBe(false);
  });

  it('removeLike retorna false si no afectó filas', async () => {
    repo.deleteLike.mockResolvedValue(0);
    const ok = await service.removeLike(1, 1);
    expect(ok).toBe(false);
  });
});


