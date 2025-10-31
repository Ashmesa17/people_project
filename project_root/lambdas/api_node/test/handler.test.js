jest.mock('../application/person_service', () => {
  const mockObtener = jest.fn();
  const mockActualizar = jest.fn();
  const mockEliminar = jest.fn();
  const mockListar = jest.fn();

  return {
    PersonaService: jest.fn().mockImplementation(() => ({
      obtener: mockObtener,
      actualizar: mockActualizar,
      eliminar: mockEliminar,
      listar: mockListar
    })),
    __mocks__: { mockObtener, mockActualizar, mockEliminar, mockListar }
  };
});

const serviceModule = require('../application/person_service');
const { __mocks__ } = serviceModule;
const { mockObtener, mockActualizar, mockEliminar, mockListar } = __mocks__;
const { getPerson, updatePerson, deletePerson, getAllPeople } = require('../handler');

describe('Handlers', () => {
  beforeEach(() => {
    mockObtener.mockClear();
    mockActualizar.mockClear();
    mockEliminar.mockClear();
    mockListar.mockClear();
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

    test('maneja error de servicio correctamente', async () => {
      mockObtener.mockRejectedValue(new Error('Error interno'));
      const result = await getPerson({ pathParameters: { documento: '123' } });
      expect(result.statusCode).toBe(500);
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

    test('maneja JSON inválido', async () => {
      const result = await updatePerson({
        pathParameters: { documento: '123' },
        body: 'invalid-json'
      });
      expect(result.statusCode).toBe(400);
    });

    test('maneja error de validación', async () => {
      mockActualizar.mockRejectedValue({ 
        statusCode: 400, 
        message: 'Datos inválidos'
      });
      const result = await updatePerson({
        pathParameters: { documento: '123' },
        body: '{}'
      });
      expect(result.statusCode).toBe(400);
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

    test('maneja error de servicio en delete', async () => {
      mockEliminar.mockRejectedValue(new Error('Delete failed'));
      const result = await deletePerson({ pathParameters: { documento: '123' } });
      expect(result.statusCode).toBe(500);
    });

    test('maneja ConditionalCheckFailedException', async () => {
      mockEliminar.mockRejectedValue({ 
        code: 'ConditionalCheckFailedException',
        message: 'Condition failed'
      });
      const result = await deletePerson({ pathParameters: { documento: '123' } });
      expect(result.statusCode).toBe(404);
    });
  });

  describe('getAllPeople', () => {
    test('debe listar personas correctamente', async () => {
      const mockPeople = [{ documento: '1' }, { documento: '2' }];
      mockListar.mockResolvedValue(mockPeople);
      
      const result = await getAllPeople();
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockPeople);
    });

    test('maneja errores del servicio', async () => {
      mockListar.mockRejectedValue(new Error('DB Error'));
      const result = await getAllPeople();
      expect(result.statusCode).toBe(500);
    });
  });
});
