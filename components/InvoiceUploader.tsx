import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Check } from 'lucide-react';
import { ParsedInvoiceData } from '../services/salesforce';
import { aiService } from '../services/ai';

interface InvoiceUploaderProps {
    onDataParsed: (data: ParsedInvoiceData) => void;
    gdprConsent: boolean;
    onGdprChange?: (checked: boolean) => void;
    onGdprError?: () => void;
    theme?: 'light' | 'dark';
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({ onDataParsed, gdprConsent, onGdprChange, onGdprError, theme = 'dark' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [lastParsedData, setLastParsedData] = useState<ParsedInvoiceData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        if (!gdprConsent) {
            setError("Please accept the GDPR and Privacy Policy before uploading.");
            onGdprError?.();
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const prompt = `
        Analyze this invoice image and extract the following data in strict JSON format:
        {
          "companyName": "string (The CUSTOMER name. LOOK SPECIFICALLY under 'Customer Details' or 'Bill To'. E.g. 'CX Team'. Do NOT use the footer text or Supplier Name)",
          "companyNumber": "string (if found, otherwise empty)",
          "accountNumber": "string",
          "invoiceNumber": "string",
          "invoiceDate": "YYYY-MM-DD",
          "totalAmount": number,
          "totalConsumption": number (total energy consumption for THIS BILL PERIOD in MWh),
          "annualConsumption": number (Yearly Total or YTD consumption in MWh. Search for 'Yearly Total', 'Annual Consumption', or 'YTD'),
          "contactFirstName": "string (contact person first name if found)",
          "contactLastName": "string (contact person last name if found)",
          "contactEmail": "string (contact email if found)",
          "contactPhone": "string (contact phone if found)",
          "sites": [
            {
              "name": "string (site name or address alias)",
              "address": "string",
              "meterPoints": [
                {
                  "mpan": "string (MPAN or Meter Point Administration Number)",
                  "meterNumber": "string"
                }
              ]
            }
          ]
          "currentRate": number,
          "yearlySavings": number
        }
        
        IMPORTANT: 
        1. **COMPANY NAME EXTRACTION IS CRITICAL**:
           - Look for a box labeled "Customer Details" or "Account Details".
           - The Company Name is the FIRST line inside that box.
           - Example: If "Customer Details" contains "CX Team", then "CX Team" is the company name.
           - **NEGATIVE CONSTRAINT**: Do NOT look at the footer or small print. "Megs Manufacturing Ltd" or similar is likely the billing agent/footer text - IGNORE IT.
           
        2. Do NOT mistake the Energy Supplier for the customer.
        3. If you find multiple sites or meters, list them all.
        4. Ensure the output is valid JSON only, no markdown formatting.
        5. For "currentRate", calculate it as totalAmount / totalConsumption (using the CURRENT bill figures).
        6. For "yearlySavings", calculate it as: annualConsumption * (currentRate - 80). Our rate is strictly £80/MWh.
           - IF annualConsumption is found (e.g. "Yearly Total", "YTD"), use it.
           - IF NOT found, estimate annualConsumption = totalConsumption * 12 (if monthly).
      `;

            const result = await aiService.generateContent({
                model: "gemini-2.5-flash",
                prompt: prompt,
                image: {
                    mimeType: file.type,
                    data: base64
                }
            });

            const text = result.text || "";
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const data: ParsedInvoiceData = JSON.parse(jsonStr);
            
            // Attach file content for upload
            data.fileContent = base64;
            data.fileName = file.name;

            console.log("Parsed Invoice Data:", data);
            onDataParsed(data);
            setLastParsedData(data);
            setSuccess(true);

        } catch (err: any) {
            console.error("Error processing invoice:", err);
            setError(err.message || "Failed to process the invoice. Please try again or enter details manually.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && (files[0].type.startsWith('image/') || files[0].type === 'application/pdf')) {
            processFile(files[0]);
        } else {
            setError("Please upload a valid image or PDF.");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full mb-8">
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${isDragging
                        ? 'border-[#00E599] bg-[#00E599]/5'
                        : success
                            ? 'border-[#00E599]/50 bg-[#00E599]/5'
                            : theme === 'light' 
                                ? 'border-gray-200 bg-gray-50 hover:border-[#3ACDFA]' 
                                : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {/* GDPR Notice inside Uploader */}
                    {!gdprConsent && !success && (
                        <div className={`mb-6 p-3 rounded-lg border max-w-md ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                            <label className="flex items-start gap-3 cursor-pointer group text-left">
                                <div className="relative flex items-center mt-1">
                                    <input 
                                        type="checkbox"
                                        checked={gdprConsent}
                                        onChange={(e) => onGdprChange?.(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className={`w-4 h-4 border-2 rounded bg-transparent peer-checked:bg-[#00E599] peer-checked:border-[#00E599] transition-all ${theme === 'light' ? 'border-gray-300' : 'border-white/30'}`}></div>
                                    <Check size={10} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className={`text-xs transition-colors ${theme === 'light' ? 'text-gray-500 group-hover:text-gray-700' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                    I agree to the <a href="#" className={`underline hover:text-[#00E599] ${theme === 'light' ? 'text-gray-900' : 'text-white'}`} onClick={(e) => e.stopPropagation()}>Privacy Policy</a> and consent to the processing of my personal data.
                                </span>
                            </label>
                        </div>
                    )}

                    {isProcessing ? (
                        <>
                            <Loader2 className="w-10 h-10 text-[#00E599] animate-spin mb-4" />
                            <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Analyzing Invoice...</p>
                            <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Extracting account and meter details</p>
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle className="w-10 h-10 text-[#00E599] mb-4" />
                            <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Invoice Processed Successfully</p>
                            <p className="text-white font-medium">Invoice Processed Successfully</p>
                            <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>We've pre-filled the form with the extracted details.</p>
                            
                             {/* Savings Display */}
                             {(lastParsedData?.yearlySavings && lastParsedData.yearlySavings > 0) && (
                                <div className="mt-4 p-4 bg-[#00E599]/10 border border-[#00E599]/30 rounded-lg w-full max-w-sm">
                                    <p className="text-[#00E599] font-medium text-lg mb-1">
                                        Potential Savings Found!
                                    </p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-gray-400">Current Rate</p>
                                            <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>£{lastParsedData.currentRate?.toFixed(2)}/MWh</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Est. Yearly Savings</p>
                                            <p className="text-[#00E599] font-bold text-2xl">
                                                £{lastParsedData.yearlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#00E599]/70 mt-2 text-center">
                                        Based on our rate of £80/MWh
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 text-sm text-[#00E599] hover:underline"
                            >
                                Upload a different file
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                                <Upload className={`w-8 h-8 ${theme === 'light' ? 'text-[#3ACDFA]' : 'text-gray-400'}`} />
                            </div>
                            <h3 className={`text-lg font-medium mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Upload your latest invoice
                            </h3>
                            <p className={`text-sm max-w-sm mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Drag and drop or click to upload. We'll extract your company details, sites, and meter points automatically.
                            </p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`px-6 py-2.5 rounded-full font-medium transition-colors ${theme === 'light' ? 'bg-gray-900 text-white hover:bg-black' : 'bg-white text-black hover:bg-gray-100'}`}
                            >
                                Select File
                            </button>
                        </>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
