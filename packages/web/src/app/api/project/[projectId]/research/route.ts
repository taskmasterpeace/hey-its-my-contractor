import { NextRequest } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

// More lenient schema for research result
const researchResultSchema = z.object({
  answer: z
    .string()
    .min(1)
    .describe("Detailed research answer for contractors"),
  sources: z
    .array(
      z.object({
        title: z.string().describe("Title of the source"),
        url: z.string().describe("URL to the source (can be domain only)"),
        snippet: z.string().describe("Brief description of the source content"),
        domain: z.string().describe("Domain name of the source"),
      })
    )
    .min(0)
    .max(5)
    .describe("Up to 5 relevant sources (can be empty if none available)"),
  related_queries: z
    .array(z.string())
    .min(0)
    .max(8)
    .describe(
      "Up to 8 related questions contractors might ask (can be empty if none available)"
    ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { query, type, context } = await request.json();
    const { projectId } = await params;

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

    // Fetch project context from database
    let projectContext = "";
    try {
      const [project] = await db
        .select({
          name: projects.name,
          address: projects.address,
          budget: projects.budget,
          startDate: projects.startDate,
          estimatedEndDate: projects.estimatedEndDate,
          metadata: projects.metadata,
        })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (project) {
        const timeline =
          project.startDate && project.estimatedEndDate
            ? `${project.startDate} to ${project.estimatedEndDate}`
            : project.startDate
            ? `Starting ${project.startDate}`
            : "Timeline not specified";

        projectContext = `
PROJECT CONTEXT:
- Project: ${project.name}
- Location: ${project.address}
- Budget: ${project.budget ? `$${project.budget}` : "Budget not specified"}
- Timeline: ${timeline}

Use this context to provide location-specific recommendations, budget-appropriate options, and timeline-conscious advice.`;
      }
    } catch (error) {
      console.warn("Could not fetch project context:", error);
      // Continue without project context if database query fails
    }

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Enhanced prompt for structured contractor research
    const enhancedPrompt = `As a professional contractor research assistant, research and provide detailed information about: ${query}

${type ? `This is specifically related to: ${type}` : ""}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}
${projectContext}

Format your response in clear, well-structured markdown for easy reading. Include:

## Key Information
Provide comprehensive contractor-focused information including:
1. **Practical information** for contractors
2. **Cost considerations** and budget ranges (consider the project budget if provided)
3. **Local supplier recommendations** (use the project location if provided)
4. **Building code and permit requirements** (specific to the project location)
5. **Installation timelines** and best practices (consider the project timeline)
6. **Tools and materials** needed
7. **Common challenges** and solutions

## Location-Specific Guidance
When project location is provided, prioritize:
- Local building codes and regulations
- Regional supplier recommendations
- Area-specific climate considerations
- Local permit requirements

## Budget Considerations
When budget is provided, focus on:
- Budget-appropriate options and alternatives
- Cost-effective solutions within the range
- Value engineering opportunities

**FORMATTING REQUIREMENTS:**
- Use markdown formatting with headers (##, ###), bold (**text**), and bullet points
- Structure content with clear sections and subsections
- Use numbered lists for step-by-step processes
- Use bullet points for item lists
- Highlight important costs or measurements with **bold text**
- Make the content scannable and professional

**REQUIREMENTS:**
- Provide up to 5 relevant sources (fewer is okay if not available)
- Provide up to 8 related questions contractors might ask (fewer is okay)
- For URLs, you can use domain names like "example.com" or full URLs
- Keep source snippets concise and informative
- Ensure all content is relevant and helpful for contractors
- Prioritize quality over quantity for sources and questions`;

    // Stream structured object using Perplexity via OpenRouter
    const { partialObjectStream, object } = streamObject({
      model: openrouter.chat("perplexity/sonar-pro"),
      schema: researchResultSchema,
      schemaName: "ContractorResearchResult",
      schemaDescription:
        "Structured research result with flexible sources and related questions",
      prompt: enhancedPrompt,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream partial updates
          for await (const partialObject of partialObjectStream) {
            // Check if controller is still writable (client hasn't disconnected)
            if (controller.desiredSize === null) {
              return;
            }

            try {
              const streamData = {
                type: "partial",
                data: partialObject,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`)
              );
            } catch (enqueueError) {
              return;
            }
          }

          // Check if controller is still writable before sending final result
          if (controller.desiredSize === null) {
            return;
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

          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
            );
            controller.close();
          } catch (enqueueError) {
            console.log(
              "Client disconnected before final result could be sent:",
              enqueueError instanceof Error
                ? enqueueError.message
                : String(enqueueError)
            );
          }
        } catch (error) {
          console.error("Streaming error:", error);

          // Only try to send error if controller is still writable
          if (controller.desiredSize !== null) {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: {"type":"error","error":"Failed to process research query"}\n\n`
                )
              );
              controller.close();
            } catch (enqueueError) {}
          }
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
