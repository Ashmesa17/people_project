import os
import pytest
from unittest.mock import patch, MagicMock
from your_module_name.dynamo_repository import DynamoRepository  # ajusta el import

@pytest.fixture
def mock_boto_resource():
    with patch("your_module_name.dynamo_repository.boto3.resource") as mock_resource:
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

def test_get_person_found(mock_boto_resource):
    repo = DynamoRepository()
    expected_item = {"documento": "123", "nombre": "Alice"}
    mock_boto_resource.get_item.return_value = {"Item": expected_item}

    result = repo.get_person("123")

    mock_boto_resource.get_item.assert_called_once_with(Key={"documento": "123"})
    assert result == expected_item

def test_get_person_not_found(mock_boto_resource):
    repo = DynamoRepository()
    mock_boto_resource.get_item.return_value = {}

    result = repo.get_person("999")

    assert result is None

def test_scan_people(mock_boto_resource):
    repo = DynamoRepository()
    expected_items = [
        {"documento": "1", "nombre": "Alice"},
        {"documento": "2", "nombre": "Bob"},
    ]
    mock_boto_resource.scan.return_value = {"Items": expected_items}

    result = repo.scan_people()

    mock_boto_resource.scan.assert_called_once()
    assert result == expected_items

def test_scan_people_empty(mock_boto_resource):
    repo = DynamoRepository()
    mock_boto_resource.scan.return_value = {}

    result = repo.scan_people()

    assert result == []
