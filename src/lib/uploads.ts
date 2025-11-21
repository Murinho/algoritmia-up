export async function uploadImage(file: File): Promise<string> {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
  const res = await fetch(`${base}/uploads/image`, {
    method: "POST",
    body: (() => {
      const formData = new FormData();
      formData.append("file", file);
      return formData;
    })(),
    credentials: "include", // so your auth cookie is sent
  });

  if (!res.ok) {
    let message = "Error al subir la imagen";
    try {
      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        "detail" in data &&
        typeof (data as { detail: unknown }).detail === "string"
      ) {
        message = (data as { detail: string }).detail;
      }
    } catch {
      // ignore JSON parse errors, keep default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
