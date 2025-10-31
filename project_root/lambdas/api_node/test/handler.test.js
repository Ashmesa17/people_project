jest.mock('../application/person_service', () => {
  const mockObtener = jest.fn();
  const mockActualizar = jest.fn();
  const mockEliminar = jest.fn();

  return {
    PersonaService: jest.fn().mockImplementation(() => ({
      obtener: mockObtener,
      actualizar: mockActualizar,
      eliminar: mockEliminar
    })),
    __mocks__: { mockObtener, mockActualizar, mockEliminar }
  };
});

const serviceModule = require('../application/person_service');
const { __mocks__ } = serviceModule;
const { mockObtener, mockActualizar, mockEliminar } = __mocks__;
const { getPerson, updatePerson, deletePerson } = require('../handler');

describe('Handlers', () => {
  beforeEach(() => {
    mockObtener.mockClear();
    mockActualizar.mockClear();
    mockEliminar.mockClear();
  });

  describe('getPerson', () => {
    test('debe obtener una persona existente', async () => {
      const mockPerson = { documento: '123', nombre: 'Test' };
      mockObtener.mockResolvedValue(mockPerson);

      const result = await getPerson({ pathParameters: { documento: '123' } });
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockPerson);
    });

    test('debe manejar documento faltante', async () => {
      const result = await getPerson({ pathParameters: {} });
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });

    test('debe manejar error 404', async () => {
      mockObtener.mockRejectedValue({ statusCode: 404, message: 'Persona no encontrada' });

      const result = await getPerson({ pathParameters: { documento: '123' } });
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toHaveProperty('error', 'Persona no encontrada');
    });
  });

  describe('updatePerson', () => {
    test('debe actualizar una persona correctamente', async () => {
      mockActualizar.mockResolvedValue({ documento: '123', nombre: 'Nuevo' });

      const result = await updatePerson({
        pathParameters: { documento: '123' },
        body: JSON.stringify({ nombre: 'Nuevo' })
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ documento: '123', nombre: 'Nuevo' });
    });

    test('debe devolver 400 por body inválido', async () => {
      const result = await updatePerson({
        pathParameters: { documento: '123' },
        body: '{ invalid json'
      });
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });
  });

  describe('deletePerson', () => {
    test('debe eliminar una persona correctamente', async () => {
      mockEliminar.mockResolvedValue({ deleted: true });

      const result = await deletePerson({ pathParameters: { documento: '123' } });
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ deleted: true });
    });

    test('debe devolver 400 si falta documento', async () => {
      const result = await deletePerson({ pathParameters: {} });
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });
  });
});
