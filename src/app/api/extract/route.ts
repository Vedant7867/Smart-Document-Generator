import { NextResponse } from "next/server";
import { classifyIntent, extractDocumentData } from "../../../lib/llm";
import { DOCUMENT_TEMPLATES, DocumentIntent } from "../../../lib/templates";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Figure out what document they need
    const intent = await classifyIntent(prompt);
    
    if (intent === "UNKNOWN") {
      return NextResponse.json({ 
        error: "Could not determine what type of document you need. Please be more specific." 
      }, { status: 400 });
    }

    // 2. Get the specific fields for that document
    const template = DOCUMENT_TEMPLATES[intent as DocumentIntent];
    const requestedFields = [...template.fields] as string[];

    // 3. Extract exactly those fields
    const data = await extractDocumentData(prompt, requestedFields);

    // 4. Return the complete package to the frontend
    return NextResponse.json({
      intent: template.id,
      documentTitle: template.title,
      ...data
    });

  } catch (error) {
    console.error("Extraction failed:", error);
    return NextResponse.json({ error: "Failed to extract data" }, { status: 500 });
  }
}