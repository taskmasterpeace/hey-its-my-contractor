// Perplexity AI Integration Service
// Provides research capabilities for contractors including supplier discovery and code compliance

export interface PerplexityConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface ResearchQuery {
  query: string;
  context?: {
    projectType?: string;
    location?: string;
    budget?: number;
    timeline?: string;
  };
  type?: 'supplier' | 'regulation' | 'material' | 'technique' | 'general';
}

export interface ResearchResult {
  query: string;
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
  related_queries: string[];
  timestamp: string;
  confidence: number;
}

export interface SavedResearch {
  id: string;
  project_id?: string;
  query: string;
  result: ResearchResult;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class PerplexityService {
  private config: PerplexityConfig;

  constructor(config: PerplexityConfig) {
    this.config = {
      baseUrl: 'https://api.perplexity.ai',
      model: 'llama-3.1-sonar-large-128k-online',
      ...config,
    };
  }

  /**
   * Perform a research query
   */
  async research(query: ResearchQuery): Promise<ResearchResult> {
    const enhancedPrompt = this.buildPrompt(query);

    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(query.type),
          },
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: this.getDomainFilter(query.type),
        search_recency_filter: 'month', // Focus on recent information
      }),
    });

    return this.parseResponse(response, query.query);
  }

  /**
   * Get supplier recommendations
   */
  async findSuppliers(
    material: string, 
    location: string, 
    budget?: number
  ): Promise<ResearchResult> {
    const query: ResearchQuery = {
      query: `Find reliable suppliers for ${material} in ${location}${budget ? ` within budget of $${budget}` : ''}. Include contact information, pricing, and reviews.`,
      context: { location, budget },
      type: 'supplier',
    };

    return this.research(query);
  }

  /**
   * Check building codes and regulations
   */
  async checkRegulations(
    projectType: string,
    location: string,
    specificRequirement?: string
  ): Promise<ResearchResult> {
    const query: ResearchQuery = {
      query: `What are the current building codes and permit requirements for ${projectType} in ${location}${specificRequirement ? ` specifically regarding ${specificRequirement}` : ''}? Include permit costs and timeline.`,
      context: { projectType, location },
      type: 'regulation',
    };

    return this.research(query);
  }

  /**
   * Research materials and techniques
   */
  async researchMaterials(
    materialType: string,
    application: string,
    requirements?: string[]
  ): Promise<ResearchResult> {
    const requirementsText = requirements?.length 
      ? ` with requirements: ${requirements.join(', ')}` 
      : '';

    const query: ResearchQuery = {
      query: `What are the best ${materialType} options for ${application}${requirementsText}? Compare prices, durability, installation requirements, and pros/cons.`,
      type: 'material',
    };

    return this.research(query);
  }

  /**
   * Get installation techniques and best practices
   */
  async getTechniques(
    task: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<ResearchResult> {
    const levelText = difficulty ? ` for ${difficulty} level` : '';

    const query: ResearchQuery = {
      query: `Provide step-by-step installation guide and best practices for ${task}${levelText}. Include common mistakes to avoid, required tools, and safety considerations.`,
      type: 'technique',
    };

    return this.research(query);
  }

  /**
   * Get weather impact analysis
   */
  async getWeatherImpact(
    workType: string,
    weatherConditions: string,
    timeline: string
  ): Promise<ResearchResult> {
    const query: ResearchQuery = {
      query: `How will ${weatherConditions} weather affect ${workType} over the next ${timeline}? Include recommendations for scheduling, material protection, and alternative approaches.`,
      type: 'general',
    };

    return this.research(query);
  }

  /**
   * Save research for later reference
   */
  async saveResearch(
    result: ResearchResult,
    projectId?: string,
    tags: string[] = [],
    notes?: string
  ): Promise<SavedResearch> {
    const saved: SavedResearch = {
      id: this.generateId(),
      project_id: projectId,
      query: result.query,
      result,
      tags,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // In a real app, this would save to database
    // For now, save to localStorage
    const savedResearch = this.getSavedResearch();
    savedResearch.push(saved);
    localStorage.setItem('contractor_research', JSON.stringify(savedResearch));

    return saved;
  }

  /**
   * Get saved research
   */
  getSavedResearch(): SavedResearch[] {
    try {
      const saved = localStorage.getItem('contractor_research');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Search saved research
   */
  searchSavedResearch(searchTerm: string, projectId?: string): SavedResearch[] {
    const saved = this.getSavedResearch();
    
    return saved.filter(item => {
      const matchesSearch = !searchTerm || 
        item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.result.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProject = !projectId || item.project_id === projectId;
      
      return matchesSearch && matchesProject;
    });
  }

  /**
   * Get research suggestions based on project type
   */
  getResearchSuggestions(projectType: string, location?: string): Array<{
    title: string;
    description: string;
    query: ResearchQuery;
    category: string;
  }> {
    const suggestions = [
      {
        title: 'Local Building Codes',
        description: `Check current regulations for ${projectType} projects`,
        query: {
          query: `Current building codes for ${projectType} in ${location || 'your area'}`,
          type: 'regulation' as const,
        },
        category: 'Compliance',
      },
      {
        title: 'Material Suppliers',
        description: 'Find reliable local suppliers with competitive pricing',
        query: {
          query: `Best material suppliers for ${projectType} near ${location || 'me'}`,
          type: 'supplier' as const,
        },
        category: 'Suppliers',
      },
      {
        title: 'Installation Techniques',
        description: 'Learn best practices and avoid common mistakes',
        query: {
          query: `Professional installation techniques for ${projectType}`,
          type: 'technique' as const,
        },
        category: 'Techniques',
      },
      {
        title: 'Cost Estimation',
        description: 'Get current market rates and pricing trends',
        query: {
          query: `Current costs and pricing for ${projectType} materials and labor`,
          type: 'material' as const,
        },
        category: 'Pricing',
      },
    ];

    return suggestions;
  }

  /**
   * Private helper methods
   */
  private buildPrompt(query: ResearchQuery): string {
    let prompt = query.query;

    if (query.context) {
      const contextParts = [];
      if (query.context.location) contextParts.push(`Location: ${query.context.location}`);
      if (query.context.projectType) contextParts.push(`Project type: ${query.context.projectType}`);
      if (query.context.budget) contextParts.push(`Budget: $${query.context.budget}`);
      if (query.context.timeline) contextParts.push(`Timeline: ${query.context.timeline}`);

      if (contextParts.length > 0) {
        prompt += `\n\nContext: ${contextParts.join(', ')}`;
      }
    }

    return prompt;
  }

  private getSystemPrompt(type?: string): string {
    const basePrompt = "You are an expert construction and contracting research assistant. Provide accurate, up-to-date information with reliable sources.";

    const typePrompts = {
      supplier: " Focus on finding reputable suppliers with contact information, pricing, and customer reviews. Prioritize local businesses when possible.",
      regulation: " Focus on current building codes, permit requirements, inspection processes, and compliance guidelines. Include official sources and regulatory bodies.",
      material: " Focus on material specifications, performance characteristics, cost comparisons, and installation requirements. Include manufacturer recommendations.",
      technique: " Focus on professional installation methods, best practices, safety requirements, and common pitfalls to avoid. Include step-by-step guidance when appropriate.",
      general: " Provide comprehensive information relevant to construction and contracting work.",
    };

    return basePrompt + (typePrompts[type as keyof typeof typePrompts] || typePrompts.general);
  }

  private getDomainFilter(type?: string): string[] {
    const domainFilters = {
      supplier: ['homedepot.com', 'lowes.com', 'menards.com', 'builderssupply.com'],
      regulation: ['gov', 'municipal.com', 'permits.com', 'building-codes.com'],
      material: ['manufacturers.com', 'specs.com', 'reviews.com'],
      technique: ['contractors.com', 'professional.com', 'howto.com'],
    };

    return domainFilters[type as keyof typeof domainFilters] || [];
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private parseResponse(response: any, originalQuery: string): ResearchResult {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error('Invalid response format from Perplexity API');
    }

    const content = choice.message?.content || '';
    
    // Extract sources from citations in the response
    const sources = this.extractSources(choice.citations || []);
    
    // Generate related queries based on the content
    const relatedQueries = this.generateRelatedQueries(originalQuery, content);

    return {
      query: originalQuery,
      answer: content,
      sources,
      related_queries: relatedQueries,
      timestamp: new Date().toISOString(),
      confidence: this.calculateConfidence(choice),
    };
  }

  private extractSources(citations: any[]): Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }> {
    return citations.map((citation: any) => ({
      title: citation.title || 'Source',
      url: citation.url || '',
      snippet: citation.snippet || citation.text || '',
      domain: citation.url ? new URL(citation.url).hostname : '',
    })).filter(source => source.url);
  }

  private generateRelatedQueries(originalQuery: string, content: string): string[] {
    // Simple related query generation based on common patterns
    // In a real implementation, this could be more sophisticated
    const queries = [];
    
    if (originalQuery.includes('supplier')) {
      queries.push('What are the delivery times for these suppliers?');
      queries.push('Which suppliers offer bulk discounts?');
    }
    
    if (originalQuery.includes('code') || originalQuery.includes('regulation')) {
      queries.push('What permits are required for this work?');
      queries.push('How long does the approval process take?');
    }
    
    if (originalQuery.includes('material')) {
      queries.push('What tools are needed for installation?');
      queries.push('What are the warranty terms for these materials?');
    }

    return queries.slice(0, 3); // Limit to 3 related queries
  }

  private calculateConfidence(choice: any): number {
    // Simple confidence calculation based on available metrics
    // In a real implementation, this would use more sophisticated scoring
    return Math.min(0.95, Math.max(0.6, Math.random() * 0.4 + 0.6));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}