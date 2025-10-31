import unittest
from unittest.mock import patch, MagicMock, mock_open
import json
import os

with patch.dict(os.environ, {
    "BUCKET_NAME": "dummy-bucket",
    "PEOPLE_TABLE": "dummy-table"
}):
    import handler

class TestS3UploadHandler(unittest.TestCase):
    @patch('handler.s3_repo')
    @patch('handler.dynamo_repo')
    @patch('builtins.open', new_callable=mock_open, read_data="CC,1234,Juan,Perez,juan@mail.com\nCE,5678,Ana,Gomez,ana@mail.com\n")
    def test_s3_upload_handler_success(self, mock_file, mock_dynamo_repo, mock_s3_repo):
        event = {
            'Records': [
                {
                    's3': {
                        'object': {
                            'key': 'test/personas.txt'
                        }
                    }
                }
            ]
        }
        context = {}

        mock_s3_repo.download_file.return_value = None
        mock_dynamo_repo.put_person.return_value = None

        response = handler.s3_upload_handler(event, context)

        mock_s3_repo.download_file.assert_called_once_with('test/personas.txt', '/tmp/personas.txt')
        self.assertEqual(mock_dynamo_repo.put_person.call_count, 2)
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['count'], 2)
        self.assertEqual(body['message'], 'Archivo procesado y guardado')

    @patch('handler.s3_repo')
    @patch('handler.dynamo_repo')
    @patch('builtins.open', new_callable=mock_open, read_data="malformateada\nCC,1234,Juan,Perez,juan@mail.com\n")
    def test_s3_upload_handler_malformed_line(self, mock_file, mock_dynamo_repo, mock_s3_repo):
        event = {
            'Records': [
                {
                    's3': {
                        'object': {
                            'key': 'test/personas.txt'
                        }
                    }
                }
            ]
        }
        context = {}

        mock_s3_repo.download_file.return_value = None
        mock_dynamo_repo.put_person.return_value = None

        response = handler.s3_upload_handler(event, context)

        mock_s3_repo.download_file.assert_called_once_with('test/personas.txt', '/tmp/personas.txt')
        self.assertEqual(mock_dynamo_repo.put_person.call_count, 1)
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['count'], 1)

if __name__ == '__main__':
    unittest.main()
