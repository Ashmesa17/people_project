const { Persona } = require('../../domain/person.js');

describe('Persona', () => {
  const datosValidos = {
    tipo_documento: 'DNI',
    documento: '123',
    nombre: 'Juan',
    apellido: 'Perez'
  };

  test('debe crear una persona con datos básicos', () => {
    const persona = new Persona(datosValidos);
    expect(persona.documento).toBe('123');
    expect(persona.nombre).toBe('Juan');
    expect(persona.correo).toBeNull();
  });

  test('debe lanzar error si faltan campos obligatorios', () => {
    const casosPrueba = [
      { ...datosValidos, tipo_documento: undefined },
      { ...datosValidos, documento: undefined },
      { ...datosValidos, nombre: undefined },
      { ...datosValidos, apellido: undefined }
    ];

    casosPrueba.forEach(caso => {
      expect(() => new Persona(caso)).toThrow(/obligatorios/);
    });
  });

  test('debe generar un item con toItem()', () => {
    const persona = new Persona(datosValidos);
    const item = persona.toItem();
    expect(item).toEqual({
      ...datosValidos,
      correo: null
    });
  });
});
