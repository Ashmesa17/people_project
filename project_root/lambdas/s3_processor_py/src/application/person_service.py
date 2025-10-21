from src.domain.person import Person
from src.infrastructure.dynamo_repository import DynamoRepository

class PersonService:
    def __init__(self, dynamo_repo: DynamoRepository):
        self.dynamo_repo = dynamo_repo

    def create_person(self, data: dict):
        person = Person(
            documento=data.get('documento'),
            nombre=data.get('nombre'),
            apellido=data.get('apellido', ''),
            tipo_documento=data.get('tipo_documento', ''),
            correo=data.get('correo', '')
        )
        self.dynamo_repo.put_person(person.__dict__)
        return person
