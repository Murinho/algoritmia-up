import os
import boto3
from botocore.client import Config

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_PUBLIC_BASE_URL = os.getenv("R2_PUBLIC_BASE_URL")  # e.g. https://pub-...r2.dev

if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
    raise RuntimeError("Missing R2 configuration environment variables")

# S3-compatible endpoint for API access
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",  # required but ignored by R2
)


def upload_file_obj(file_obj, key: str, content_type: str | None = None) -> str:
    """
    Uploads a file-like object to R2 under the given key.
    Returns the public URL to access it.
    """
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type

    s3_client.upload_fileobj(
        Fileobj=file_obj,
        Bucket=R2_BUCKET_NAME,
        Key=key,
        ExtraArgs=extra_args,
    )

    # Public URL using the bucket's public domain
    if R2_PUBLIC_BASE_URL:
        base = R2_PUBLIC_BASE_URL.rstrip("/")
        return f"{base}/{key}"

    # Fallback: generic S3-style URL (bucket in path)
    return f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{R2_BUCKET_NAME}/{key}"


def delete_object(key: str) -> None:
    """
    Delete an object from R2 by key. No-op if it fails.
    """
    try:
        s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
    except Exception:
        # we don't want avatar deletion to crash user actions
        pass


def get_key_from_url(url: str) -> str | None:
    """
    Given a public URL, try to recover the object key.
    Works for:
    - https://pub-xxx.r2.dev/<key>
    - https://ACCOUNT_ID.r2.cloudflarestorage.com/bucket/<key>
    """
    if not url:
        return None

    if R2_PUBLIC_BASE_URL and url.startswith(R2_PUBLIC_BASE_URL.rstrip("/") + "/"):
        return url[len(R2_PUBLIC_BASE_URL.rstrip("/")) + 1 :]

    # handle generic S3-style URL: .../bucket/key
    marker = f"/{R2_BUCKET_NAME}/"
    idx = url.find(marker)
    if idx != -1:
        return url[idx + len(marker) :]

    return None
