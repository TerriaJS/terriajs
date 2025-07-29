function readBase64(file: Blob): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      const base64: string | undefined =
        typeof dataUrl === "string" ? dataUrl.split(",")[1] : undefined;
      resolve(base64);
    };

    reader.onerror = reject;
  });
}

export default readBase64;
