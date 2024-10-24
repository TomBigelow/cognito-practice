from dotenv import load_dotenv
import os
import boto3

load_dotenv()

aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION")
aws_s3_bucket_name = os.getenv("AWS_S3_BUCKET_NAME")

s3 = boto3.client('s3', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key, region_name=aws_region)

def upload_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root,file)
            s3_path = os.path.relpath(file_path, directory)
            try:
                s3.upload_file(file_path, aws_s3_bucket_name, s3_path)
                print(f'Successfully uploaded {s3_path} to {aws_s3_bucket_name}')
            except Exception as e:
                print(f'Failed to upload {s3_path}: {e}')

upload_files('../dist')