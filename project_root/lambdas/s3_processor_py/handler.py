import json
from src.infrastructure.s3_repository import S3Repository
from src.infrastructure.dynamo_repository import DynamoRepository
from src.application.person_service import PersonService

s3_repo = S3Repository()
dynamo_repo = DynamoRepository()
person_service = PersonService(dynamo_repo)

def s3_upload_handler(event, context):
    for record in event['Records']:
        object_key = record['s3']['object']['key']
        file_name = f"/tmp/{object_key.split('/')[-1]}"
        s3_repo.download_file(object_key, file_name)

        personas = []
        with open(file_name, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    tipo_doc, documento, nombre, apellido, correo = line.split(',')
                    persona = {
                        'tipo_documento': tipo_doc.strip(),
                        'documento': documento.strip(),
                        'nombre': nombre.strip(),
                        'apellido': apellido.strip(),
                        'correo': correo.strip()
                    }
                    personas.append(persona)
                    dynamo_repo.put_person(persona)
                except ValueError:
                    print(f"Línea mal formateada: {line}")

        print(f"{len(personas)} personas procesadas y guardadas en DynamoDB.")

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Archivo procesado y guardado', 'count': len(personas)})
    }
