const { PersonaService } = require('../application/person_service');

// 🧠 Mock completo de PersonaService
jest.mock('../application/person_service.js', () => ({
  PersonaService: jest.fn().mockImplementation(() => ({
    obtener: jest.fn(),
    listar: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  })),
}));

// Importar después del mock
const handler = require('../handler');

describe('Handler Lambda Functions', () => {
  let mockService;

  beforeEach(() => {
    mockService = new PersonaService();
    jest.clearAllMocks();
  });

  describe('getPerson', () => {
    it('debería retornar 400 si no se pasa documento', async () => {
      const result = await handler.getPerson({ pathParameters: {} });
      expect(result.statusCode).toBe(400);
    });

    it('debería retornar persona si existe', async () => {
      const persona = { documento: '123', nombre: 'Alice' };
      mockService.obtener.mockResolvedValue(persona);

      const result = await handler.getPerson({ pathParameters: { documento: '123' } });

      expect(mockService.obtener).toHaveBeenCalledWith('123');
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(persona);
    });

    it('debería manejar error de persona no encontrada', async () => {
      const err = new Error('Persona no encontrada');
      err.statusCode = 404;
      mockService.obtener.mockRejectedValue(err);

      const result = await handler.getPerson({ pathParameters: { documento: '999' } });

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Persona no encontrada');
    });
  });

  describe('getAllPeople', () => {
    it('debería retornar lista de personas', async () => {
      const personas = [{ documento: '1' }, { documento: '2' }];
      mockService.listar.mockResolvedValue(personas);

      const result = await handler.getAllPeople();

      expect(mockService.listar).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(personas);
    });

    it('debería manejar error interno', async () => {
      mockService.listar.mockRejectedValue(new Error('fallo DB'));

      const result = await handler.getAllPeople();

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('fallo DB');
    });
  });

  describe('updatePerson', () => {
    it('debería retornar 400 si falta documento', async () => {
      const event = { pathParameters: {}, body: '{}' };
      const result = await handler.updatePerson(event);
      expect(result.statusCode).toBe(400);
    });

    it('debería retornar 400 si el body no es JSON válido', async () => {
      const event = { pathParameters: { documento: '123' }, body: 'no-json' };
      const result = await handler.updatePerson(event);
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('Formato JSON inválido');
    });

    it('debería actualizar correctamente una persona', async () => {
      const updated = { documento: '123', nombre: 'Nuevo' };
      mockService.actualizar.mockResolvedValue(updated);

      const event = {
        pathParameters: { documento: '123' },
        body: JSON.stringify({ nombre: 'Nuevo' }),
      };

      const result = await handler.updatePerson(event);

      expect(mockService.actualizar).toHaveBeenCalledWith('123', { nombre: 'Nuevo' });
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updated);
    });

    it('debería manejar error de persona no encontrada (ConditionalCheckFailedException)', async () => {
      const err = new Error();
      err.code = 'ConditionalCheckFailedException';
      mockService.actualizar.mockRejectedValue(err);

      const event = {
        pathParameters: { documento: '999' },
        body: JSON.stringify({ nombre: 'X' }),
      };

      const result = await handler.updatePerson(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Persona no encontrada');
    });
  });

  describe('deletePerson', () => {
    it('debería retornar 400 si falta documento', async () => {
      const result = await handler.deletePerson({ pathParameters: {} });
      expect(result.statusCode).toBe(400);
    });

    it('debería eliminar una persona existente', async () => {
      mockService.eliminar.mockResolvedValue({ deleted: true });

      const result = await handler.deletePerson({ pathParameters: { documento: '123' } });

      expect(mockService.eliminar).toHaveBeenCalledWith('123');
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ deleted: true });
    });

    it('debería manejar error ConditionalCheckFailedException', async () => {
      const err = new Error('error');
      err.code = 'ConditionalCheckFailedException';
      mockService.eliminar.mockRejectedValue(err);

      const result = await handler.deletePerson({ pathParameters: { documento: '999' } });

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Persona no encontrada');
    });

    it('debería manejar error inesperado con 500', async () => {
      mockService.eliminar.mockRejectedValue(new Error('Falla DB'));

      const result = await handler.deletePerson({ pathParameters: { documento: '123' } });

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('Falla DB');
    });
  });
});
