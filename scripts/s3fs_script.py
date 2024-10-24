from dotenv import load_dotenv
import os
import s3fs
import json

load_dotenv()
aws_s3_bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
print(aws_s3_bucket_name)

fs = s3fs.S3FileSystem()

json_data = {"message": "Hello, World!"}

def upload_json(bucket_name, s3_file_path, json_data):
    try:
        with fs.open(f'{bucket_name}/{s3_file_path}', 'w') as s3_file:
            json.dump(json_data, s3_file)
        print('Upload successful')
    except Exception as e:
        print(f"Upload failed: {e}")

def download_json(bucket_name, s3_file_path, local_file_path):
    try:
        with fs.open(f'{bucket_name}/{s3_file_path}', 'r') as s3_file:
            json_data = json.load(s3_file)
            with open(local_file_path, 'w') as local_file:
                json.dump(json_data, local_file, indent=4)
    except Exception as e:
        print(f"Download failed: {e}")

def upload_file(local_file_path, bucket_name, s3_file_path):
    try:
        print(f'Uploading {local_file_path} to {bucket_name}/{s3_file_path}')
        with open(local_file_path, 'rb') as local_file:
            with fs.open(f'{bucket_name}/{s3_file_path}', 'wb') as s3_file:
                s3_file.write(local_file.read())
    except Exception as e:
        print(f"Upload failed: {e}")

def read_file(bucket_name, s3_file_path):
    try:
        with fs.open(f'{bucket_name}/{s3_file_path}', 'r') as s3_file:
            print(s3_file.read())
    except Exception as e:
        print(f"Read failed: {e}")

def download_file(bucket_name, s3_file_path, local_file_path):
    try:
        with fs.open(f'{bucket_name}/{s3_file_path}', 'r') as s3_file:
            with open(local_file_path, 'w') as local_file:
                local_file.write(s3_file.read())
    except Exception as e:
        print(f"Error downloading file: {e}")


def update_file(bucket_name, s3_file_path, new_content):
    try:
        with fs.open(f'{bucket_name}/{s3_file_path}', 'w') as s3_file:
            s3_file.write(new_content)
    except Exception as e:
        print(f"Update failed: {e}")

def upload_binary_file(local_file_path, bucket_name, s3_file_path):
    try:
        with open(local_file_path, 'rb') as local_file:
            with fs.open(f'{bucket_name}/{s3_file_path}', 'wb') as s3_file:
                s3_file.write(local_file.read())
    except Exception as e:
        print(f"Upload failed: {e}")

def delete_file(bucket_name, s3_file_path):
    try:
        fs.rm(f'{bucket_name}/{s3_file_path}')
    except Exception as e:
        print(f"Delete failed: {e}")
        

def main():
    #upload_file('example.txt', aws_s3_bucket_name, 'example1.txt')
    #download_file(aws_s3_bucket_name, 'example1.txt', 'example1.txt')
    #read_file(aws_s3_bucket_name, 'example.txt')
    #update_file(aws_s3_bucket_name, 'example.txt', 'hello')
    #upload_json(aws_s3_bucket_name, 'example.json', json_data)
    #download_json(aws_s3_bucket_name, 'example.json', 'example.json')
    #upload_binary_file('headshot.jfif', aws_s3_bucket_name, 'headshot.jfif')
    delete_file(aws_s3_bucket_name, 'headshot.jfif')

if __name__ == '__main__':
    main()