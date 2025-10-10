import { NextRequest } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamObject } from "ai";
import { z } from "zod";

// More lenient schema for research result
const researchResultSchema = z.object({
  answer: z.string().describe("Detailed research answer for contractors"),
  sources: z
    .array(
      z.object({
        title: z.string().describe("Title of the source"),
        url: z.string().describe("URL to the source (can be domain only)"),
        snippet: z.string().describe("Brief description of the source content"),
        domain: z.string().describe("Domain name of the source"),
      })
    )
    .length(3)
    .describe("Exactly 3 relevant sources"),
  related_queries: z
    .array(z.string())
    .length(5)
    .describe("Exactly 5 related questions contractors might ask"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { query, type, context } = await request.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Enhanced prompt for structured contractor research
    const enhancedPrompt = `As a professional contractor research assistant, research and provide detailed information about: ${query}

${type ? `This is specifically related to: ${type}` : ""}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}

Provide comprehensive contractor-focused information including:
1. Practical information for contractors
2. Cost considerations and budget ranges  
3. Local supplier recommendations when applicable
4. Building code and permit requirements
5. Installation timelines and best practices
6. Tools and materials needed
7. Common challenges and solutions

STRICT REQUIREMENTS:
- Provide EXACTLY 3 sources (no more, no less)
- Provide EXACTLY 5 related questions (no more, no less)
- For URLs, you can use domain names like "example.com" or full URLs
- Keep source snippets very short (under 80 characters)
- Make sure all sources are relevant and real`;

    // Stream structured object using Perplexity via OpenRouter
    const { partialObjectStream, object } = streamObject({
      model: openrouter.chat("perplexity/sonar-pro"),
      schema: researchResultSchema,
      schemaName: "ContractorResearchResult",
      schemaDescription:
        "Structured research result with exactly 3 sources and 5 questions",
      prompt: enhancedPrompt,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream partial updates
          for await (const partialObject of partialObjectStream) {
            const streamData = {
              type: "partial",
              data: partialObject,
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`)
            );
          }

          // Get final complete object
          const finalObject = await object;

          // Process URLs to ensure they're clickable and truncate snippets
          const processedSources = finalObject.sources.map((source: any) => ({
            ...source,
            url: source.url.startsWith("http")
              ? source.url
              : `https://${source.url}`,
            snippet:
              source.snippet.length > 80
                ? source.snippet.substring(0, 80) + "..."
                : source.snippet,
          }));

          // Send final complete result
          const result = {
            query,
            answer: finalObject.answer,
            sources: processedSources,
            related_queries: finalObject.related_queries,
            timestamp: new Date().toISOString(),
            confidence: 0.95,
          };

          const finalData = {
            type: "complete",
            result: result,
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: {"type":"error","error":"Failed to process research query"}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Research API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process research query" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
