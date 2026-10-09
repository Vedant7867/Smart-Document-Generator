"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  workflowId: string;
}

export default function SignaturePad({ onSave, workflowId }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState("");

  const handleClear = () => {
    sigCanvas.current?.clear();
    setError("");
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError("Please provide a signature before approving.");
      return;
    }
    // Exports as base64 transparent PNG to be injected via Docxtemplater ImageModule
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="border p-4 rounded-lg bg-white shadow-sm max-w-md">
      <h3 className="font-semibold text-lg mb-4">Faculty Advisor Approval</h3>
      <div className="border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="blue"
          canvasProps={{ width: 400, height: 150, className: "signature-canvas" }}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      
      <div className="flex justify-between mt-4">
        <button onClick={handleClear} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
          Clear Pad
        </button>
        <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium">
          Sign & Seal Document
        </button>
      </div>
    </div>
  );
}