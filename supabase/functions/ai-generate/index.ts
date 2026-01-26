import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, image, media, model = "gemini-1.5-flash", systemInstruction, responseModalities, speechConfig } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({ 
        model: model,
        systemInstruction: systemInstruction 
    });

    const parts = [];
    const mediaInput = media || image;
    if (mediaInput && mediaInput.mimeType && mediaInput.data) {
      parts.push({
        inlineData: {
          mimeType: mediaInput.mimeType,
          data: mediaInput.data,
        },
      });
    }

    if (prompt) {
      parts.push({ text: prompt });
    }

    const result = await modelInstance.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
            responseModalities: responseModalities,
            speechConfig: speechConfig
        }
    });

    const text = result.response.text();

    return new Response(JSON.stringify({ 
        text,
        candidates: [result.response.candidates[0]] // Simplify for now
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
