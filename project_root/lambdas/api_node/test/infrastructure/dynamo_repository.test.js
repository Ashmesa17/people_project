jest.mock('aws-sdk', () => {
  const mockGet = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockScan = jest.fn();

  return {
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({
        get: (params) => ({ promise: () => mockGet(params) }),
        update: (params) => ({ promise: () => mockUpdate(params) }),
        delete: (params) => ({ promise: () => mockDelete(params) }),
        scan: (params) => ({ promise: () => mockScan(params) })
      }))
    },
    __mocks__: { mockGet, mockUpdate, mockDelete, mockScan }
  };
});

const aws = require('aws-sdk');
const { __mocks__ } = aws;
const { mockGet, mockUpdate, mockDelete, mockScan } = __mocks__;

const { DynamoRepository } = require('../../infrastructure/dynamo_repository.js');

describe('DynamoRepository', () => {
  let repo;

  beforeEach(() => {
    process.env.PEOPLE_TABLE = 'test-table';
    mockGet.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockScan.mockClear();
    repo = new DynamoRepository();
  });

  test('debe crear una instancia del repositorio', () => {
    const r = new DynamoRepository();
    expect(r).toBeDefined();
  });

  test('debe obtener una persona por documento', async () => {
    const mockPerson = { documento: '123', nombre: 'Test' };
    mockGet.mockResolvedValueOnce({ Item: mockPerson });

    const result = await repo.getPerson('123');
    expect(result).toEqual(mockPerson);
    expect(mockGet).toHaveBeenCalledWith({
      TableName: 'test-table',
      Key: { documento: '123' }
    });
  });

  test('getPerson debe manejar registro no encontrado', async () => {
    mockGet.mockResolvedValueOnce({}); // no Item

    await expect(repo.getPerson('123'))
      .rejects
      .toThrow('Persona no encontrada');
  });

  test('debe actualizar una persona', async () => {
    const updatedAttrs = { documento: '123', nombre: 'Nuevo' };
    mockUpdate.mockResolvedValueOnce({ Attributes: updatedAttrs });

    const result = await repo.updatePerson('123', { nombre: 'Nuevo' });
    expect(result).toEqual(updatedAttrs);
    expect(mockUpdate).toHaveBeenCalled();
  });

  test('updatePerson debe validar datos vacíos', async () => {
    await expect(repo.updatePerson('123', {}))
      .rejects
      .toThrow('No hay datos válidos para actualizar');
  });

  test('debe eliminar una persona', async () => {
    mockDelete.mockResolvedValueOnce({});
    const res = await repo.deletePerson('123');
    expect(res).toEqual({ deleted: true });
    expect(mockDelete).toHaveBeenCalledWith({
      TableName: 'test-table',
      Key: { documento: '123' },
      ConditionExpression: 'attribute_exists(documento)'
    });
  });

  test('debe obtener todas las personas', async () => {
    const mockItems = [{ documento: '1' }, { documento: '2' }];
    mockScan.mockResolvedValueOnce({ Items: mockItems });

    const result = await repo.getAllPeople();
    expect(result).toEqual(mockItems);
    expect(mockScan).toHaveBeenCalledWith({ TableName: 'test-table' });
  });
});
