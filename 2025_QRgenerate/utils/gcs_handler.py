from google.cloud import storage
import os

def upload_to_gcs(source_file_path, destination_blob_name, bucket_name=None):
    """
    Uploads a file to the bucket.
    """
    if not bucket_name:
        bucket_name = os.environ.get('BUCKET_NAME')
    
    if not bucket_name:
        raise ValueError("Bucket name not provided and BUCKET_NAME env var not set.")

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_path)

    return blob.public_url

def generate_signed_url(blob_name, bucket_name=None, expiration=3600):
    """
    Generates a v4 signed URL for downloading a blob.
    """
    if not bucket_name:
        bucket_name = os.environ.get('BUCKET_NAME')
        
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        # This URL is valid for 1 hour
        expiration=expiration,
        method="GET",
    )
    return url
