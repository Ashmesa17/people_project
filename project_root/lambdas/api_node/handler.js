const { PersonaService } = require('./application/person_service');
const service = new PersonaService();

const handleError = (err, defaultStatus = 500) => {
  console.error('Error:', err);
  return {
    statusCode: err.statusCode || defaultStatus,
    body: JSON.stringify({ error: err.message || 'Internal server error' })
  };
};

const buildResponse = (statusCode, bodyObj) => {
  return {
    statusCode,
    body: JSON.stringify(bodyObj)
  };
};

module.exports.getPerson = async (event) => {
  if (!event.pathParameters?.documento) {
    return buildResponse(400, { error: 'Documento requerido' });
  }

  try {
    const persona = await service.obtener(event.pathParameters.documento);
    return buildResponse(200, persona);
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
  if (!event.pathParameters?.documento) {
    return buildResponse(400, { error: 'Documento requerido' });
  }

  let datos;
  try {
    datos = JSON.parse(event.body || '{}');
  } catch {
    return buildResponse(400, { error: 'Formato JSON inválido' });
  }

  try {
    const updated = await service.actualizar(event.pathParameters.documento, datos);
    return buildResponse(200, updated);
  } catch (err) {
    /* istanbul ignore else */
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
