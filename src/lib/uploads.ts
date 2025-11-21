export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/image`, {
    method: "POST",
    body: formData,
    credentials: "include", // so your auth cookie is sent
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).detail ?? "Error al subir la imagen");
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
