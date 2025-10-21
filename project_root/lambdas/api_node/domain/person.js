class Persona {
  constructor({ tipo_documento, documento, nombre, apellido, correo }) {
    if (!tipo_documento || !documento || !nombre || !apellido) {
      throw new Error('Los campos tipo_documento, documento, nombre y apellido son obligatorios.');
    }

    this.tipo_documento = tipo_documento;
    this.documento = documento;
    this.nombre = nombre;
    this.apellido = apellido;
    this.correo = correo || null;
  }

  actualizar(datos) {
    if (datos.nombre) this.nombre = datos.nombre;
    if (datos.apellido) this.apellido = datos.apellido;
    if (datos.correo) this.correo = datos.correo;
  }

  toItem() {
    return {
      tipo_documento: this.tipo_documento,
      documento: this.documento,
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
    };
  }
}
module.exports = { Persona };