jest.mock('../../infrastructure/dynamo_repository.js', () => {
  const mockUpdatePerson = jest.fn();
  const mockGetPerson = jest.fn();
  const mockDeletePerson = jest.fn();

  return {
    DynamoRepository: jest.fn().mockImplementation(() => ({
      getPerson: mockGetPerson,
      updatePerson: mockUpdatePerson,
      deletePerson: mockDeletePerson,
      getAllPeople: jest.fn(),
    })),
    mockUpdatePerson,
    mockGetPerson,
    mockDeletePerson,
  };
});

jest.mock('../../domain/person.js', () => {
  return {
    Persona: jest.fn().mockImplementation((data) => {
      return {
        actualizar: jest.fn(),
        _data: data,
      };
    }),
  };
});

const { PersonaService } = require('../../application/person_service.js');
const { Persona } = require('../../domain/person.js');
const { DynamoRepository, mockUpdatePerson, mockGetPerson, mockDeletePerson } = require('../../infrastructure/dynamo_repository.js');

describe('PersonaService - camposPermitidos', () => {
  let service;

  beforeEach(() => {
    // clear and set defaults
    mockUpdatePerson.mockClear();
    mockGetPerson.mockClear();
    Persona.mockClear();

    mockGetPerson.mockResolvedValue({ 
      documento: 'doc123', 
      nombre: 'Juan', 
      apellido: 'Lopez' 
    });
    mockUpdatePerson.mockResolvedValue({ 
      documento: 'doc123', 
      nombre: 'Ana', 
      correo: 'a@b.com' 
    });

    service = new PersonaService();
  });

  test('actualizar filtra solo campos permitidos y no vacíos antes de llamar updatePerson', async () => {
    const datos = {
      nombre: 'Ana',
      apellido: '',              // empty -> should be ignored
      correo: 'a@b.com',
      tipo_documento: undefined, // undefined -> ignored
      edad: 30,                  // not permitted -> ignored
      extra: 'shouldBeIgnored',  // not permitted -> ignored
    };

    await service.actualizar('doc123', datos);

    expect(mockUpdatePerson).toHaveBeenCalledTimes(1);
    expect(mockUpdatePerson).toHaveBeenCalledWith('doc123', { nombre: 'Ana', correo: 'a@b.com' });

    // Persona should be constructed with the existing person
    expect(Persona).toHaveBeenCalledWith({ documento: 'doc123', nombre: 'Juan', apellido: 'Lopez' });
  });

  test('actualizar lanza 400 cuando no hay campos válidos para actualizar', async () => {
    const datosInvalidos = {
      nombre: '',               // empty
      apellido: null,           // null
      correo: '',               // empty
      tipo_documento: undefined,// undefined
      edad: 50,                 
    };

    await expect(service.actualizar('doc123', datosInvalidos))
      .rejects
      .toMatchObject({ statusCode: 400, message: 'No hay campos válidos para actualizar' });

    expect(mockUpdatePerson).not.toHaveBeenCalled();
  });

  test('actualizar lanza 404 cuando la persona no existe', async () => {
    mockGetPerson.mockResolvedValueOnce(null);

    await expect(service.actualizar('nonexistentDoc', { nombre: 'X' }))
      .rejects
      .toMatchObject({ statusCode: 404, message: 'Persona no encontrada' });

    expect(mockUpdatePerson).not.toHaveBeenCalled();
  });
});

describe('PersonaService', () => {
  let service;

  beforeEach(() => {
    mockUpdatePerson.mockClear();
    mockGetPerson.mockClear();
    mockDeletePerson.mockClear();
    Persona.mockClear();
    service = new PersonaService();
  });

  describe('obtener', () => {
    test('debe retornar una persona existente', async () => {
      const mockPerson = { documento: '123', nombre: 'Test' };
      mockGetPerson.mockResolvedValue(mockPerson);

      const result = await service.obtener('123');
      expect(result).toEqual(mockPerson);
    });

    test('debe lanzar 404 si la persona no existe', async () => {
      mockGetPerson.mockResolvedValue(null);

      await expect(service.obtener('123'))
        .rejects
        .toMatchObject({ statusCode: 404, message: 'Persona no encontrada' });
    });
  });

  describe('eliminar', () => {
    test('debe eliminar una persona existente', async () => {
      mockGetPerson.mockResolvedValue({ documento: '123' });
      mockDeletePerson.mockResolvedValue({ deleted: true });

      const result = await service.eliminar('123');
      expect(mockDeletePerson).toHaveBeenCalledWith('123');
      expect(result).toEqual({ deleted: true });
    });

    test('debe lanzar 404 si la persona a eliminar no existe', async () => {
      mockGetPerson.mockResolvedValue(null);

      await expect(service.eliminar('123'))
        .rejects
        .toMatchObject({ statusCode: 404, message: 'Persona no encontrada' });
    });
  });
});

