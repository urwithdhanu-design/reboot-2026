import { api } from "./api";

function createDemoImageFile(
  label: string,
  fileName: string,
  width = 640,
  height = 400,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not create demo image"));
      return;
    }

    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#1a4d3a";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.fillStyle = "#1a4d3a";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DEMO", width / 2, height / 2 - 16);
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText(label, width / 2, height / 2 + 20);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create demo image"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85,
    );
  });
}

const DOC_LABELS: Record<string, string> = {
  passport: "PASSPORT",
  driving_licence: "DRIVING LICENCE",
  national_id: "NATIONAL ID",
};

/** Upload a demo identity document and selfie in one step (no camera or file picker). */
export async function runKycDemoFill(token: string, documentType: string) {
  const docLabel = DOC_LABELS[documentType] ?? "ID DOCUMENT";
  const docFile = await createDemoImageFile(docLabel, "demo-document.jpg");
  await api.uploadKycDocument(token, docFile);
  const selfieFile = await createDemoImageFile("SELFIE", "demo-selfie.jpg", 480, 480);
  await api.uploadKycSelfie(token, selfieFile);
}
