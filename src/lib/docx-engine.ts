import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import expressionParser from "docxtemplater/expressions.js";

/**
 * Extracts raw tags from an uploaded .docx template buffer
 */
export function extractPlaceholdersFromBuffer(buffer: Buffer): string[] {
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, {
    parser: expressionParser,
    modules: [],
  });
  
  // Uses docxtemplater's internal AST to identify tags
  const text = doc.getFullText();
  const regex = /\{\{([^}]+)\}\}/g;
  const tags = new Set<string>();
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const cleanTag = match[1].trim().split(" ")[0]; // handles formatter syntax if any
    if (!cleanTag.startsWith("#") && !cleanTag.startsWith("/")) {
      tags.add(cleanTag);
    }
  }
  
  return Array.from(tags);
}

/**
 * Compiles a new .docx buffer injecting the JSON data
 */
export function compileDocx(templateBuffer: Buffer, data: Record<string, any>): Buffer {
  const zip = new PizZip(templateBuffer);
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: expressionParser,
  });

  doc.render(data);
  
  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

/**
 * Converts DOCX Buffer to PDF via Gotenberg microservice (Production standard for containerized apps)
 */
export async function convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const GOTENBERG_URL = process.env.GOTENBERG_URL || "http://localhost:3000/forms/libreoffice/convert";
  
  const formData = new FormData();
  formData.append("files", new Blob([new Uint8Array(docxBuffer)]), "document.docx");

  const response = await fetch(GOTENBERG_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`PDF Conversion failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}