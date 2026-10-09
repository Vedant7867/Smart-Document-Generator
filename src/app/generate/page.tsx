"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, FileText, CheckCircle, Mic } from "lucide-react";

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  // NEW: A secret vault to hold whatever text was in the box before we pressed record
  const textVaultRef = useRef(""); 
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const handleVoiceInput = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support native voice input. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.lang = 'en-IN';

    // 1. Lock the current text into the vault right before we start listening
    textVaultRef.current = prompt;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let currentSessionTranscript = "";
      
      // 2. Loop through everything spoken in THIS session only
      for (let i = 0; i < event.results.length; i++) {
        currentSessionTranscript += event.results[i][0].transcript;
      }

      // 3. Cleanly combine the vault text + a space + the live speech
      const space = textVaultRef.current && currentSessionTranscript ? " " : "";
      setPrompt(textVaultRef.current + space + currentSessionTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, templateId: "default-template-id" }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert(`Extraction Error: ${data.error || "Failed to parse data"}`);
        return;
      }

      setExtraction(data);
      if (data.extractedData) {
        Object.keys(data.extractedData).forEach((key) => {
          setValue(key, data.extractedData[key]);
        });
      }
    } catch (error) {
      alert("Failed to connect to the extraction engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalGenerate = async (formData: Record<string, string>) => {
    setGenerating(true);
    
    try {
      const res = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: "mock-doc-uuid",
          finalizedData: formData,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const fileUrl = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement("a");
      downloadLink.href = fileUrl;
      downloadLink.download = "event-approval.pdf"; 
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);

    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to compile document. Check terminal for errors.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">1. Describe the Event</h2>
          <div className="relative">
            <textarea 
              className="w-full h-48 p-4 pb-12 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="E.g., We are hosting a React workshop..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleVoiceInput}
              type="button"
              className={`absolute bottom-4 right-4 p-3 rounded-full flex items-center justify-center transition-all shadow-md ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse shadow-red-200" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Dictate prompt"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>
        <button 
          onClick={handleExtract}
          disabled={loading || !prompt}
          className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Extracting Entities..." : "Parse & Map to Template"}
        </button>
      </div>

      <div className="bg-gray-50 p-6 border rounded-md h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-black">2. Review & Compile</h2>
        {extraction && extraction.documentTitle && (
          <div className="mb-6 inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold">
            Detected: {extraction.documentTitle}
          </div>
        )}
        {!extraction && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText size={48} className="mb-4" />
            <p>Awaiting extraction...</p>
          </div>
        )}

        {extraction && (
          <form onSubmit={handleSubmit(handleFinalGenerate)} className="space-y-6">
            
            {extraction.missingFields?.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="text-yellow-600 mr-2" />
                  <p className="font-semibold text-yellow-800">Missing Information</p>
                </div>
                <p className="text-sm text-yellow-700 mt-1">{extraction.clarificationQuestion}</p>
              </div>
            )}

            <div className="space-y-4">
              {extraction.extractedData && Object.keys(extraction.extractedData).map((field) => (
                <div key={field} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  <input
                    {...register(field, { required: true })}
                    className="p-2 border rounded-md focus:border-blue-500 bg-white text-black"
                  />
                  {errors[field] && <span className="text-red-500 text-xs mt-1">This field is required</span>}
                </div>
              ))}
              
              {extraction.missingFields?.map((field: string) => (
                <div key={field} className="flex flex-col">
                  <label className="text-sm font-medium text-red-600 mb-1 capitalize">{field} (Required)</label>
                  <input
                    {...register(field, { required: true })}
                    className="p-2 border border-red-300 rounded-md focus:border-red-500 bg-red-50 text-black"
                  />
                  {errors[field] && <span className="text-red-500 text-xs mt-1">Please provide the missing data</span>}
                </div>
              ))}
            </div>
            
            {/* Spawn Receipt Upload if it's a Reimbursement */}
            {extraction.uiConfig?.requiresReceiptUpload && (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                <FileText size={32} className="mb-2 text-gray-400" />
                <p className="text-sm font-medium text-black">Upload Vendor Bills / Receipts</p>
                <p className="text-xs text-gray-400 mb-3">Required for reimbursement claims</p>
                <input type="file" className="text-sm w-full max-w-[250px] text-black" />
              </div>
            )}

            {/* Spawn Signature Routing if it's an Event or Leave */}
            {extraction.uiConfig?.requiresSignatureRouting && (
              <div className="flex flex-col border-t pt-4">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Route for Digital Signature
                </label>
                <select className="p-2 border rounded-md focus:border-blue-500 bg-white text-black">
                  <option>HOD - Computer Science Engineering</option>
                  <option>Dean of Student Welfare (DSW)</option>
                  <option>Faculty Advisor</option>
                </select>
              </div>
            )}

            <button 
              type="submit"
              disabled={generating}
              className="w-full bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              <CheckCircle className="mr-2" size={20} />
              {generating ? "Compiling PDF..." : "Lock & Generate Document"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}