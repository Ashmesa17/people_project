import pytest
from src.application.person_service import PersonService
from src.domain.person import Person

class FakeDynamoRepository:
    def __init__(self):
        self.saved_person = None

    def put_person(self, data):
        self.saved_person = data
        return {"status": "ok"}


@pytest.fixture
def fake_repo():
    return FakeDynamoRepository()


@pytest.fixture
def service(fake_repo):
    return PersonService(fake_repo)


def test_create_person_success(service, fake_repo):
    data = {
        "documento": "123",
        "nombre": "Juan",
        "apellido": "Pérez",
        "tipo_documento": "CC",
        "correo": "juan@test.com"
    }

    person = service.create_person(data)

    assert isinstance(person, Person)
    assert person.documento == "123"
    assert person.nombre == "Juan"
    assert fake_repo.saved_person["nombre"] == "Juan"
    assert "apellido" in fake_repo.saved_person


def test_create_person_missing_optional_fields(service, fake_repo):
    data = {
        "documento": "456",
        "nombre": "Ana"
    }

    person = service.create_person(data)

    # ✅ Verifica valores por defecto
    assert person.apellido == ""
    assert person.tipo_documento == ""
    assert person.correo == ""


def test_create_person_missing_required_field(service):
    data = {
        "nombre": "Carlos"
    }

    with pytest.raises(ValueError):
        service.create_person(data)
