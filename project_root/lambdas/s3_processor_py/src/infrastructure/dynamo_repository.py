import boto3
import os

class DynamoRepository:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ['PEOPLE_TABLE']
        self.table = self.dynamodb.Table(self.table_name)

    def put_person(self, persona: dict):
        self.table.put_item(Item=persona)

    def get_person(self, documento: str):
        response = self.table.get_item(Key={'documento': documento})
        return response.get('Item')

    def scan_people(self):
        response = self.table.scan()
        return response.get('Items', [])
