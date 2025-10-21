const { PersonaService } = require('./application/person_service');
const service = new PersonaService();

const handleError = (err, defaultStatus = 500) => {
  console.error('Error:', err);
  return {
    statusCode: err.statusCode || defaultStatus,
    body: JSON.stringify({
      error: err.message || 'Error interno del servidor',
    }),
  };
};

module.exports.getPerson = async (event) => {
  const documento = event.pathParameters?.documento;

  if (!documento) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Documento requerido' }) };
  }

  try {
    const persona = await service.obtener(documento);
    if (!persona) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Persona no encontrada' }) };
    }
    return { statusCode: 200, body: JSON.stringify(persona) };
  } catch (err) {
    return handleError(err);
  }
};

module.exports.getAllPeople = async () => {
  try {
    const personas = await service.listar();
    return { statusCode: 200, body: JSON.stringify(personas) };
  } catch (err) {
    return handleError(err);
  }
};

module.exports.updatePerson = async (event) => {
  const documento = event.pathParameters?.documento;

  if (!documento) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Documento requerido' }) };
  }

  let datos;
  try {
    datos = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Formato JSON inválido en el cuerpo de la solicitud' }) };
  }

  try {
    const updated = await service.actualizar(documento, datos);
    return { statusCode: 200, body: JSON.stringify(updated) };
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      err.statusCode = 404;
      err.message = 'Persona no encontrada';
    }
    return handleError(err, 400);
  }
};

module.exports.deletePerson = async (event) => {
  const documento = event.pathParameters?.documento;

  if (!documento) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Documento requerido' }) };
  }

  try {
    const result = await service.eliminar(documento);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    if (err.code === 'ConditionalCheckFailedException') {
      err.statusCode = 404;
      err.message = 'Persona no encontrada';
    }
    return handleError(err);
  }
};
