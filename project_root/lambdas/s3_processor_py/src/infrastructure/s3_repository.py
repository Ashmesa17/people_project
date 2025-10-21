import boto3
import os

class S3Repository:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bucket_name = os.environ['BUCKET_NAME']

    def upload_file(self, file_name: str, object_name: str):
        self.s3.upload_file(file_name, self.bucket_name, object_name)

    def download_file(self, object_name: str, file_name: str):
        self.s3.download_file(self.bucket_name, object_name, file_name)