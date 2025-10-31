const { Persona } = require('../../domain/person');

describe('Persona', () => {
  describe('constructor', () => {
    it('debería crear una persona válida con todos los campos', () => {
      const datos = {
        tipo_documento: 'CC',
        documento: '123',
        nombre: 'Alice',
        apellido: 'López',
        correo: 'alice@example.com',
      };

      const persona = new Persona(datos);

      expect(persona.tipo_documento).toBe('CC');
      expect(persona.documento).toBe('123');
      expect(persona.nombre).toBe('Alice');
      expect(persona.apellido).toBe('López');
      expect(persona.correo).toBe('alice@example.com');
    });

    it('debería asignar correo = null si no se proporciona', () => {
      const datos = {
        tipo_documento: 'CC',
        documento: '123',
        nombre: 'Alice',
        apellido: 'López',
      };

      const persona = new Persona(datos);

      expect(persona.correo).toBeNull();
    });

    it('debería lanzar error si falta un campo obligatorio', () => {
      const datosIncompletos = {
        tipo_documento: 'CC',
        documento: '123',
        nombre: '',
        apellido: 'López',
      };

      expect(() => new Persona(datosIncompletos))
        .toThrow('Los campos tipo_documento, documento, nombre y apellido son obligatorios.');
    });
  });

  describe('actualizar()', () => {
    let persona;

    beforeEach(() => {
      persona = new Persona({
        tipo_documento: 'CC',
        documento: '123',
        nombre: 'Alice',
        apellido: 'López',
        correo: 'alice@example.com',
      });
    });

    it('debería actualizar solo los campos enviados', () => {
      persona.actualizar({ nombre: 'Ana', correo: 'ana@correo.com' });

      expect(persona.nombre).toBe('Ana');
      expect(persona.apellido).toBe('López'); // sin cambios
      expect(persona.correo).toBe('ana@correo.com');
    });

    it('no debería cambiar nada si se pasa un objeto vacío', () => {
      const original = { ...persona };
      persona.actualizar({});

      expect(persona).toEqual(original);
    });
  });

  describe('toItem()', () => {
    it('debería retornar un objeto con las propiedades correctas', () => {
      const persona = new Persona({
        tipo_documento: 'CC',
        documento: '123',
        nombre: 'Alice',
        apellido: 'López',
        correo: 'alice@example.com',
      });

      const item = persona.toItem();

      expect(item).toEqual({
        tipo_documento: 'CC',
        documento: '123',
        nombre: 'Alice',
        apellido: 'López',
        correo: 'alice@example.com',
      });
    });
  });
});
