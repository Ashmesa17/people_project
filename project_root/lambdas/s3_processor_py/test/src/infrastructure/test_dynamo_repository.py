import pytest
from unittest.mock import patch, MagicMock
from src.infrastructure.dynamo_repository import DynamoRepository

@pytest.fixture
def mock_boto_resource():
    with patch("src.infrastructure.dynamo_repository.boto3.resource") as mock_resource:
        mock_table = MagicMock()
        mock_resource.return_value.Table.return_value = mock_table
        yield mock_table

@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("PEOPLE_TABLE", "fake_table")

def test_put_person(mock_boto_resource):
    repo = DynamoRepository()
    persona = {"documento": "123", "nombre": "Alice"}

    repo.put_person(persona)

    mock_boto_resource.put_item.assert_called_once_with(Item=persona)


