import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

// Function to parse Perplexity response and extract sources and related questions
function parsePerplexityResponse(text: string) {
  const sources: any[] = [];
  let cleanedText = text;
  let relatedQueries: string[] = [];

  // Extract related questions if they exist
  const relatedQuestionsMatch = text.match(
    /RELATED_QUESTIONS:\s*([\s\S]*?)(?:\n\n|$)/
  );
  if (relatedQuestionsMatch) {
    const questionsText = relatedQuestionsMatch[1];
    const questionMatches = questionsText.match(/- (.+)/g);
    if (questionMatches) {
      relatedQueries = questionMatches
        .map((q) => q.replace(/^- /, "").trim())
        .slice(0, 5);
    }
    // Remove the related questions section from the main text
    cleanedText = text.replace(/RELATED_QUESTIONS:[\s\S]*$/, "").trim();
  }

  // Pattern to match URLs in the text
  const urlPattern = /https?:\/\/[^\s\)]+/g;
  const urls = cleanedText.match(urlPattern) || [];

  // Pattern to match citation numbers like [1], (1), etc.
  const citationPattern = /\[(\d+)\]|\((\d+)\)/g;
  const citations = cleanedText.match(citationPattern) || [];

  // Extract URLs and create source objects (limit to 3)
  const uniqueUrls = [...new Set(urls)].slice(0, 3);

  uniqueUrls.forEach((url, index) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace("www.", "");

      sources.push({
        title: `Source from ${domain}`,
        url: url,
        snippet: `Information sourced from ${domain}`,
        domain: domain,
      });
    } catch (error) {
      // Skip invalid URLs
    }
  });

  // If we have citations but no direct URLs, create placeholder sources (limit to 3)
  if (citations.length > 0 && sources.length === 0) {
    citations.slice(0, 3).forEach((citation, index) => {
      sources.push({
        title: `Citation ${citation}`,
        url: "#",
        snippet: "Information from referenced source",
        domain: "referenced-source.com",
      });
    });
  }

  // Clean the text by removing excessive URLs and citation markers
  cleanedText = cleanedText.replace(/https?:\/\/[^\s\)]+/g, "");
  cleanedText = cleanedText.replace(/\s+/g, " ").trim();

  return { cleanedText, sources, relatedQueries };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { query, type, context } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Enhance the prompt for contractor-specific research with explicit source requirements
    const enhancedPrompt = `As a professional contractor research assistant, please provide detailed information about: ${query}

${type ? `This is specifically related to: ${type}` : ""}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}

Please include:
1. Practical information for contractors
2. Cost considerations and budget ranges
3. Local supplier recommendations when applicable
4. Building code and permit requirements
5. Installation timelines and best practices
6. Tools and materials needed
7. Common challenges and solutions

IMPORTANT: Please include specific website URLs and sources in your response where you found this information. This is critical for verification and further research.

At the end of your response, please provide 5 related questions that contractors might ask about this topic. Format them exactly like this:

RELATED_QUESTIONS:
- Question 1 here
- Question 2 here
- Question 3 here
- Question 4 here
- Question 5 here`;

    // Generate text using Perplexity via OpenRouter
    const { text } = await generateText({
      model: openrouter.chat("perplexity/sonar-pro"),
      prompt: enhancedPrompt,
    });

    // Parse sources and related questions from Perplexity response
    const { cleanedText, sources, relatedQueries } =
      parsePerplexityResponse(text);

    // Format the response to match the expected ResearchResult type
    const result = {
      query,
      answer: cleanedText || text, // Use cleaned text if available, fallback to original
      sources,
      related_queries: relatedQueries,
      timestamp: new Date().toISOString(),
      confidence: sources.length > 0 ? 0.95 : 0.85, // Higher confidence with sources
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Failed to process research query" },
      { status: 500 }
    );
  }
}
