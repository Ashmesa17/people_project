import pytest
from src.domain.person import Person


def test_person_creation_success():
    person = Person(
        documento="12345",
        nombre="Juan",
        apellido="Pérez",
        tipo_documento="CC",
        correo="juan@example.com"
    )

    assert person.documento == "12345"
    assert person.nombre == "Juan"
    assert person.apellido == "Pérez"
    assert person.tipo_documento == "CC"
    assert person.correo == "juan@example.com"


def test_person_creation_with_optional_fields_missing():
    person = Person(documento="67890", nombre="Carlos")

    assert person.documento == "67890"
    assert person.nombre == "Carlos"
    assert person.apellido == ""
    assert person.tipo_documento == ""
    assert person.correo == ""


def test_person_missing_documento_should_raise_error():
    with pytest.raises(ValueError) as excinfo:
        Person(documento=None, nombre="Laura")
    assert "obligatorios" in str(excinfo.value)


def test_person_missing_nombre_should_raise_error():
    with pytest.raises(ValueError) as excinfo:
        Person(documento="54321", nombre=None)
    assert "obligatorios" in str(excinfo.value)
