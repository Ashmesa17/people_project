const AWS = require('aws-sdk');
const { DynamoRepository } = require('../../infrastructure/dynamo_repository');

const mockGet = jest.fn();
const mockScan = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock('aws-sdk', () => {
  const DocumentClient = jest.fn(() => ({
    get: mockGet,
    scan: mockScan,
    update: mockUpdate,
    delete: mockDelete,
  }));
  return { DynamoDB: { DocumentClient } };
});

describe('DynamoRepository', () => {
  let repo;

  beforeEach(() => {
    process.env.PEOPLE_TABLE = 'fake_table';
    repo = new DynamoRepository();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getPerson()', () => {
    it('debería retornar una persona si existe', async () => {
      const item = { documento: '123', nombre: 'Alice' };
      mockGet.mockReturnValue({ promise: () => Promise.resolve({ Item: item }) });

      const result = await repo.getPerson('123');

      expect(mockGet).toHaveBeenCalledWith({
        TableName: 'fake_table',
        Key: { documento: '123' },
      });
      expect(result).toEqual(item);
    });

    it('debería lanzar error 404 si la persona no existe', async () => {
      mockGet.mockReturnValue({ promise: () => Promise.resolve({}) });

      await expect(repo.getPerson('999')).rejects.toThrow('Persona no encontrada');
    });

    it('debería lanzar error 500 ante error inesperado', async () => {
      const dbError = new Error('Falla Dynamo');
      mockGet.mockReturnValue({ promise: () => Promise.reject(dbError) });

      await expect(repo.getPerson('123')).rejects.toHaveProperty('statusCode', 500);
    });
  });

  describe('getAllPeople()', () => {
    it('debería retornar lista de personas', async () => {
      const items = [{ doc: '1' }, { doc: '2' }];
      mockScan.mockReturnValue({ promise: () => Promise.resolve({ Items: items }) });

      const result = await repo.getAllPeople();

      expect(mockScan).toHaveBeenCalledWith({ TableName: 'fake_table' });
      expect(result).toEqual(items);
    });

    it('debería retornar lista vacía si no hay Items', async () => {
      mockScan.mockReturnValue({ promise: () => Promise.resolve({}) });

      const result = await repo.getAllPeople();
      expect(result).toEqual([]);
    });

    it('debería manejar errores inesperados', async () => {
      mockScan.mockReturnValue({ promise: () => Promise.reject(new Error('boom')) });

      await expect(repo.getAllPeople()).rejects.toHaveProperty('statusCode', 500);
    });
  });

  describe('updatePerson()', () => {
    it('debería actualizar una persona correctamente', async () => {
      const updated = { documento: '123', nombre: 'Nuevo' };
      mockUpdate.mockReturnValue({ promise: () => Promise.resolve({ Attributes: updated }) });

      const result = await repo.updatePerson('123', { nombre: 'Nuevo' });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('debería lanzar error 400 si no hay datos válidos', async () => {
      await expect(repo.updatePerson('123', {}))
        .rejects.toThrow('No hay datos válidos para actualizar');
    });

    it('debería lanzar error 404 si Dynamo lanza ConditionalCheckFailedException', async () => {
      const err = new Error('not found');
      err.code = 'ConditionalCheckFailedException';
      mockUpdate.mockReturnValue({ promise: () => Promise.reject(err) });

      await expect(repo.updatePerson('123', { nombre: 'X' }))
        .rejects.toHaveProperty('statusCode', 404);
    });
  });

  describe('deletePerson()', () => {
    it('debería eliminar una persona existente', async () => {
      mockDelete.mockReturnValue({ promise: () => Promise.resolve() });

      const result = await repo.deletePerson('123');

      expect(mockDelete).toHaveBeenCalledWith({
        TableName: 'fake_table',
        Key: { documento: '123' },
        ConditionExpression: 'attribute_exists(documento)',
      });
      expect(result).toEqual({ deleted: true });
    });

    it('debería lanzar error 404 si registro no existe', async () => {
      const err = new Error('no existe');
      err.code = 'ConditionalCheckFailedException';
      mockDelete.mockReturnValue({ promise: () => Promise.reject(err) });

      await expect(repo.deletePerson('123')).rejects.toHaveProperty('statusCode', 404);
    });

    it('debería manejar error inesperado como 500', async () => {
      mockDelete.mockReturnValue({ promise: () => Promise.reject(new Error('boom')) });

      await expect(repo.deletePerson('123')).rejects.toHaveProperty('statusCode', 500);
    });
  });

  describe('_handleDynamoError()', () => {
    it('debería traducir ValidationException a error 400', () => {
      const error = { code: 'ValidationException' };
      expect(() => repo._handleDynamoError(error, 'probar')).toThrow('Error de validación al probar.');
    });

    it('debería traducir ResourceNotFoundException a error 500', () => {
      const error = { code: 'ResourceNotFoundException' };
      expect(() => repo._handleDynamoError(error, 'listar')).toThrow('Tabla DynamoDB no encontrada.');
    });

    it('debería manejar error desconocido como 500 genérico', () => {
      const error = new Error('otro');
      expect(() => repo._handleDynamoError(error, 'listar')).toThrow('Error interno al listar.');
    });
  });
});
