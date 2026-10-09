export async function uploadToStorage(path: string, buffer: Buffer): Promise<string> {
  // Mock upload logic for local development
  console.log(`Mock uploaded ${buffer.length} bytes to ${path}`);
  return `https://storage.mock.local/${path}`;
}