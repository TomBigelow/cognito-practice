from dotenv import load_dotenv
import os
import subprocess

load_dotenv()
aws_s3_bucket_name = os.getenv("AWS_S3_BUCKET_NAME")

def build_project():
    try:
        print('running build command')
        npm_path = r'C:\Program Files\nodejs\npm.cmd'
        result = subprocess.run([npm_path, 'run', 'build'], check=True, capture_output=True, text=True)
        print('build successful')
        print(result.stdout)
        print(result.stderr)
    except subprocess.CalledProcessError as e:
        print(f"build failed: {e}")
        print(e.stdout)
        print(e.stderr)

def upload_files(directory, bucket_name, s3_folder):
    command = ['aws', 's3', 'sync', directory, f's3://{bucket_name}/{s3_folder}']
    try:
        print('running upload command')
        subprocess.run(command, check=True)
        print('upload successful')
    except subprocess.CalledProcessError as e:
        print(f"Upload failed: {e}")

    
def main():
    build_project()
    upload_files('dist', aws_s3_bucket_name, '')

if __name__ == '__main__':
        main()