import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const { finalizedData } = await req.json();

    // 1. Create a fresh PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]); 
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 2. Draw the Document Header
    page.drawText("Official Event Approval Document", { 
      x: 50, y: 730, size: 20, font: boldFont, color: rgb(0, 0.2, 0.6) 
    });
    
    page.drawLine({
      start: { x: 50, y: 715 }, end: { x: 550, y: 715 }, thickness: 1, color: rgb(0.5, 0.5, 0.5)
    });

    // 3. Loop through the verified form data and print it
    let yPosition = 670;
    for (const [key, value] of Object.entries(finalizedData)) {
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      page.drawText(`${formattedKey}:`, { x: 50, y: yPosition, size: 12, font: boldFont });
      // Ensure the value is cast to a string to prevent pdf-lib crashes
      page.drawText(`${String(value)}`, { x: 200, y: yPosition, size: 12, font });
      
      yPosition -= 35; 
    }

    // 4. Save the PDF as raw bytes
    const pdfBytes = await pdfDoc.save();

    // 5. Send it back to the frontend as an actual PDF file
    return new Response(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="event-approval.pdf"',
      },
    });

  } catch (error) {
    console.error("Compilation failed:", error);
    return new Response(JSON.stringify({ error: "Failed to generate document" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}