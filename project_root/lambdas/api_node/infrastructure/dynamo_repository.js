const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

class DynamoRepository {
  constructor() {
    this.tableName = process.env.PEOPLE_TABLE;
  }

  async getPerson(documento) {
    try {
      const params = {
        TableName: this.tableName,
        Key: { documento }
      };

      const result = await dynamo.get(params).promise();
      if (!result.Item) {
        const err = new Error('Persona no encontrada');
        err.statusCode = 404;
        throw err;
      }

      return result.Item;

    } catch (error) {
      console.error('Error en getPerson:', error);
      // Si el error ya tiene statusCode, relanzarlo (preservar mensajes esperados)
      if (error && error.statusCode) throw error;
      this._handleDynamoError(error, 'obtener persona');
    }
  }

  async getAllPeople() {
    try {
      const params = { TableName: this.tableName };
      const result = await dynamo.scan(params).promise();
      return result.Items || [];
    } catch (error) {
      console.error('Error en getAllPeople:', error);
      if (error && error.statusCode) throw error;
      this._handleDynamoError(error, 'listar personas');
    }
  }

  async updatePerson(documento, datos) {
    try {
      const updateExpr = [];
      const exprAttrValues = {};
      const exprAttrNames = {};

      if (!datos || Object.keys(datos).length === 0) {
        const err = new Error('No hay datos válidos para actualizar');
        err.statusCode = 400;
        throw err;
      }

      Object.keys(datos).forEach((k) => {
        if (datos[k] !== undefined && datos[k] !== null) {
          updateExpr.push(`#${k} = :${k}`);
          exprAttrNames[`#${k}`] = k;
          exprAttrValues[`:${k}`] = datos[k];
        }
      });

      if (updateExpr.length === 0) {
        const err = new Error('No se encontraron campos válidos para actualizar');
        err.statusCode = 400;
        throw err;
      }

      const params = {
        TableName: this.tableName,
        Key: { documento },
        UpdateExpression: `SET ${updateExpr.join(', ')}`,
        ExpressionAttributeValues: exprAttrValues,
        ExpressionAttributeNames: exprAttrNames,
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(documento)' 
      };

      console.log('Update params:', JSON.stringify(params, null, 2));

      const result = await dynamo.update(params).promise();
      return result.Attributes;

    } catch (error) {
      console.error('Error en updatePerson:', error);
      if (error && error.statusCode) throw error;
      this._handleDynamoError(error, 'actualizar persona');
    }
  }

  async deletePerson(documento) {
    try {
      const params = {
        TableName: this.tableName,
        Key: { documento },
        ConditionExpression: 'attribute_exists(documento)' 
      };

      await dynamo.delete(params).promise();
      return { deleted: true };

    } catch (error) {
      console.error('Error en deletePerson:', error);
      if (error && error.statusCode) throw error;
      this._handleDynamoError(error, 'eliminar persona');
    }
  }

  _handleDynamoError(error, operacion) {
    if (error && error.code === 'ConditionalCheckFailedException') {
      const err = new Error(`No se pudo ${operacion}: registro no encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    if (error && error.code === 'ValidationException') {
      const err = new Error(`Error de validación al ${operacion}.`);
      err.statusCode = 400;
      throw err;
    }

    if (error && error.code === 'ResourceNotFoundException') {
      const err = new Error(`Tabla DynamoDB no encontrada.`);
      err.statusCode = 500;
      throw err;
    }

    const err = new Error(`Error interno al ${operacion}.`);
    err.statusCode = 500;
    err.original = error && error.message;
    throw err;
  }
}

module.exports = { DynamoRepository };
