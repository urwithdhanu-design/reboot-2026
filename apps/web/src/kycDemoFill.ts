import { api } from "./api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoImageFile(name: string): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#006a4d";
    ctx.fillRect(0, 0, 4, 4);
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create demo image"))), "image/jpeg", 0.92);
  });
  return new File([blob], name, { type: "image/jpeg" });
}

export async function runKycDemoFill(token: string): Promise<{ uploaded: boolean; selfie: boolean }> {
  const doc = await demoImageFile("demo-passport.jpg");
  await api.uploadKycDocument(token, doc);
  await sleep(400);
  const selfie = await demoImageFile("demo-selfie.jpg");
  await api.uploadKycSelfie(token, selfie);
  await sleep(300);
  return { uploaded: true, selfie: true };
}
