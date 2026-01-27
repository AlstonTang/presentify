import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngineInterface | null = null;

const SYSTEM_PROMPT = `
You are an expert presentation designer. Your task is to take markdown notes and transform them into a professional reveal.js presentation.
Rules:
1. Use --- to separate horizontal slides.
2. Ensure the output is valid markdown.
3. Improve phrasing, add bullet points, and structure content logically.
4. Add speaker notes using the "Note:" prefix at the end of a slide if appropriate.
5. Do not hallucinate external references.
6. Return ONLY the enhanced markdown.
`;

export async function enhanceMarkdown(markdown: string, onProgress?: (status: string) => void): Promise<string> {
    if (!engine) {
        try {
            onProgress?.("Loading Local AI Model...");

            // Check for WebGPU support
            if (!(navigator as any).gpu) {
                throw new Error("WebGPU not detected. For Intel Arc on Linux, please enable 'Enable unsafe WebGPU' and 'Vulkan' in chrome://flags.");
            }

            engine = await webllm.CreateMLCEngine(
                "Phi-3-mini-4k-instruct-q4f16_1-MLC",
                {
                    initProgressCallback: (report) => onProgress?.(report.text),
                    // We could potentially try fallback device here if needed
                }
            );
        } catch (error: any) {
            console.error('WebLLM Init Error:', error);
            if (error.message?.includes("WebGPU")) {
                throw new Error("Local AI requires WebGPU. On Linux (Intel Arc), go to chrome://flags and enable:\n1. Experimental WebGPU\n2. Vulkan\n3. Unsafe WebGPU");
            }
            throw error;
        }
    }

    onProgress?.("Analysing and Enhancing...");
    const messages: webllm.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Please enhance these notes into reveal.js slides:\n\n${markdown}` }
    ];

    const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.7,
    });

    return reply.choices[0].message.content || markdown;
}
