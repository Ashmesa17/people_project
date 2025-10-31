import pytest
from unittest.mock import patch, MagicMock
from src.infrastructure.s3_repository import S3Repository 

@pytest.fixture
def mock_boto_client():
    with patch("src.infrastructure.s3_repository.boto3.client") as mock_client:
        mock_s3 = MagicMock()
        mock_client.return_value = mock_s3
        yield mock_s3

@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("BUCKET_NAME", "fake-bucket")

def test_upload_file(mock_boto_client):
    repo = S3Repository()

    repo.upload_file("test.txt", "uploads/test.txt")

    mock_boto_client.upload_file.assert_called_once_with(
        "test.txt", "fake-bucket", "uploads/test.txt"
    )

def test_download_file(mock_boto_client):
    repo = S3Repository()

    repo.download_file("uploads/test.txt", "downloaded.txt")

    mock_boto_client.download_file.assert_called_once_with(
        "fake-bucket", "uploads/test.txt", "downloaded.txt"
    )
