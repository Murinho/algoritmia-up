# algoritmia_api/routes/uploads.py

import uuid
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from ..tables.auth import get_current_user
from ..r2_client import upload_file_obj

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    # Basic validation
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # Generate a unique key: e.g. images/users/<id>/<uuid>.ext
    ext = ""
    if "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()

    key = f"images/{current_user['id']}/{uuid.uuid4().hex}"
    if ext:
        key += f".{ext}"

    # Upload to R2
    try:
        url = upload_file_obj(file.file, key=key, content_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo a R2: {e!r}")

    # TODO: optionally save `url` to your DB (users.profile_image_url, events.banner_url, etc.)
    # Example pseudo-code:
    # await db.execute("UPDATE users SET avatar_url = %s WHERE id = %s", (url, current_user["id"]))

    return {"url": url, "key": key}
