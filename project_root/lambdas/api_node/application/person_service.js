const { DynamoRepository } = require('../infrastructure/dynamo_repository.js');
const { Persona } = require('../domain/person.js');

const repo = new DynamoRepository();

class PersonaService {
  async obtener(documento) {
    try {
      const persona = await repo.getPerson(documento);
      if (!persona) {
        const err = new Error('Persona no encontrada');
        err.statusCode = 404;
        throw err;
      }
      return persona;
    } catch (error) {
      console.error('Error en obtener persona:', error);
      if (!error.statusCode) error.statusCode = 500;
      throw error;
    }
  }

  async listar() {
    try {
      return await repo.getAllPeople();
    } catch (error) {
      console.error('Error en listar personas:', error);
      const err = new Error('Error al listar personas');
      err.statusCode = 500;
      throw err;
    }
  }

  async actualizar(documento, datos) {
    try {
      const personaExistente = await repo.getPerson(documento);
      if (!personaExistente) {
        const err = new Error('Persona no encontrada');
        err.statusCode = 404;
        throw err;
      }

      const persona = new Persona(personaExistente);
      persona.actualizar(datos);

      const camposPermitidos = ['nombre', 'apellido', 'correo', 'tipo_documento'];
      const datosParaActualizar = {};

      camposPermitidos.forEach((k) => {
        if (datos[k] !== undefined && datos[k] !== null && datos[k] !== '') {
          datosParaActualizar[k] = datos[k];
        }
      });

      if (Object.keys(datosParaActualizar).length === 0) {
        const err = new Error('No hay campos válidos para actualizar');
        err.statusCode = 400;
        throw err;
      }

      const actualizado = await repo.updatePerson(documento, datosParaActualizar);
      return actualizado;

    } catch (error) {
      console.error('Error en actualizar persona:', error);

      if (error.code === 'ConditionalCheckFailedException') {
        error.statusCode = 404;
        error.message = 'Persona no encontrada';
      } else if (error.code === 'ValidationException') {
        error.statusCode = 400;
        error.message = 'Error de validación en los datos';
      } else if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error interno al actualizar la persona';
      }

      throw error;
    }
  }

  async eliminar(documento) {
    try {
      const personaExistente = await repo.getPerson(documento);
      if (!personaExistente) {
        const err = new Error('Persona no encontrada');
        err.statusCode = 404;
        throw err;
      }

      return await repo.deletePerson(documento);
    } catch (error) {
      console.error('Error en eliminar persona:', error);

      if (error.code === 'ConditionalCheckFailedException') {
        error.statusCode = 404;
        error.message = 'Persona no encontrada';
      } else if (!error.statusCode) {
        error.statusCode = 500;
        error.message = 'Error interno al eliminar persona';
      }

      throw error;
    }
  }
}

module.exports = { PersonaService };
