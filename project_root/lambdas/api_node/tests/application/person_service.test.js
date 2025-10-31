const { PersonaService } = require('../../application/person_service');
const { DynamoRepository } = require('../../infrastructure/dynamo_repository');
const { Persona } = require('../../domain/person');

// Mocks
jest.mock('../../infrastructure/dynamo_repository.js');
jest.mock('../../domain/person.js');

describe('PersonaService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = {
      getPerson: jest.fn(),
      getAllPeople: jest.fn(),
      updatePerson: jest.fn(),
      deletePerson: jest.fn(),
    };
    DynamoRepository.mockImplementation(() => mockRepo);
    service = new PersonaService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('obtener()', () => {
    it('debería retornar la persona si existe', async () => {
      const persona = { documento: '123', nombre: 'Alice' };
      mockRepo.getPerson.mockResolvedValue(persona);

      const result = await service.obtener('123');

      expect(result).toEqual(persona);
      expect(mockRepo.getPerson).toHaveBeenCalledWith('123');
    });

    it('debería lanzar error 404 si la persona no existe', async () => {
      mockRepo.getPerson.mockResolvedValue(null);

      await expect(service.obtener('999')).rejects.toThrow('Persona no encontrada');
    });

    it('debería lanzar error 500 si ocurre un fallo inesperado', async () => {
      mockRepo.getPerson.mockRejectedValue(new Error('DB error'));

      await expect(service.obtener('123')).rejects.toHaveProperty('statusCode', 500);
    });
  });

  describe('listar()', () => {
    it('debería retornar todas las personas', async () => {
      const personas = [{ documento: '1' }, { documento: '2' }];
      mockRepo.getAllPeople.mockResolvedValue(personas);

      const result = await service.listar();

      expect(result).toEqual(personas);
    });

    it('debería lanzar error 500 si hay un fallo al listar', async () => {
      mockRepo.getAllPeople.mockRejectedValue(new Error('Falla'));

      await expect(service.listar()).rejects.toThrow('Error al listar personas');
    });
  });

  describe('actualizar()', () => {
    it('debería actualizar una persona existente', async () => {
      const personaExistente = { documento: '123', nombre: 'Old Name' };
      const personaActualizada = { documento: '123', nombre: 'New Name' };

      mockRepo.getPerson.mockResolvedValue(personaExistente);
      mockRepo.updatePerson.mockResolvedValue(personaActualizada);
      Persona.mockImplementation(() => ({
        actualizar: jest.fn(),
      }));

      const result = await service.actualizar('123', { nombre: 'New Name' });

      expect(mockRepo.getPerson).toHaveBeenCalledWith('123');
      expect(mockRepo.updatePerson).toHaveBeenCalledWith('123', { nombre: 'New Name' });
      expect(result).toEqual(personaActualizada);
    });

    it('debería lanzar error 404 si la persona no existe', async () => {
      mockRepo.getPerson.mockResolvedValue(null);

      await expect(service.actualizar('999', { nombre: 'X' }))
        .rejects.toThrow('Persona no encontrada');
    });

    it('debería lanzar error 400 si no hay campos válidos', async () => {
      const persona = { documento: '123', nombre: 'Alice' };
      mockRepo.getPerson.mockResolvedValue(persona);
      Persona.mockImplementation(() => ({
        actualizar: jest.fn(),
      }));

      await expect(service.actualizar('123', { edad: 30 }))
        .rejects.toThrow('No hay campos válidos para actualizar');
    });

    it('debería manejar errores de DynamoDB con códigos específicos', async () => {
      const persona = { documento: '123', nombre: 'Alice' };
      mockRepo.getPerson.mockResolvedValue(persona);
      Persona.mockImplementation(() => ({
        actualizar: jest.fn(),
      }));

      const dbError = new Error('Falla Dynamo');
      dbError.code = 'ValidationException';
      mockRepo.updatePerson.mockRejectedValue(dbError);

      await expect(service.actualizar('123', { nombre: 'X' }))
        .rejects.toHaveProperty('statusCode', 400);
    });
  });

  describe('eliminar()', () => {
    it('debería eliminar una persona existente', async () => {
      const persona = { documento: '123' };
      mockRepo.getPerson.mockResolvedValue(persona);
      mockRepo.deletePerson.mockResolvedValue({ ok: true });

      const result = await service.eliminar('123');

      expect(result).toEqual({ ok: true });
      expect(mockRepo.deletePerson).toHaveBeenCalledWith('123');
    });

    it('debería lanzar error 404 si la persona no existe', async () => {
      mockRepo.getPerson.mockResolvedValue(null);

      await expect(service.eliminar('999')).rejects.toThrow('Persona no encontrada');
    });

    it('debería manejar errores inesperados con statusCode 500', async () => {
      mockRepo.getPerson.mockRejectedValue(new Error('DB crash'));

      await expect(service.eliminar('123'))
        .rejects.toHaveProperty('statusCode', 500);
    });
  });
});
