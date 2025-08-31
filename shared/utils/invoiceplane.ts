// InvoicePlane API Integration Service
// MIT License - Full commercial freedom

export interface InvoicePlaneConfig {
  baseUrl: string;
  apiKey: string;
  version?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  company?: string;
}

export interface InvoiceItem {
  name: string;
  description: string;
  quantity: number;
  price: number;
  tax_rate?: number;
}

export interface Invoice {
  id?: string;
  client_id: string;
  invoice_number?: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  discount?: number;
  tax_rate?: number;
  total?: number;
}

export class InvoicePlaneService {
  private config: InvoicePlaneConfig;

  constructor(config: InvoicePlaneConfig) {
    this.config = {
      version: '1',
      ...config,
    };
  }

  /**
   * Create a new client
   */
  async createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    const response = await this.makeRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });

    return response;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
    const response = await this.makeRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });

    return response;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.makeRequest(`/invoices/${invoiceId}`);
    return response;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<Invoice> {
    const response = await this.makeRequest(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    return response;
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoiceId: string): Promise<string> {
    const response = await this.makeRequest(`/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      responseType: 'blob',
    });

    // Return URL for PDF download
    return `${this.config.baseUrl}/invoices/${invoiceId}/pdf`;
  }

  /**
   * Send invoice via email
   */
  async sendInvoice(invoiceId: string, emailOptions?: {
    subject?: string;
    message?: string;
    cc?: string[];
  }): Promise<boolean> {
    const response = await this.makeRequest(`/invoices/${invoiceId}/email`, {
      method: 'POST',
      body: JSON.stringify(emailOptions || {}),
    });

    return response.success || false;
  }

  /**
   * Create invoice from FieldTime project milestone
   */
  async createMilestoneInvoice(
    projectId: string,
    milestoneTitle: string,
    clientData: Client,
    items: InvoiceItem[],
    dueInDays: number = 30
  ): Promise<Invoice> {
    // Calculate dates
    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueInDays);

    const invoiceData: Omit<Invoice, 'id'> = {
      client_id: clientData.id,
      invoice_date: invoiceDate,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'draft',
      items,
      notes: `Invoice for project milestone: ${milestoneTitle}`,
      terms: 'Payment due within 30 days. Late fees may apply after due date.',
    };

    return await this.createInvoice(invoiceData);
  }

  /**
   * Create invoice from change order
   */
  async createChangeOrderInvoice(
    changeOrderId: string,
    changeOrderTitle: string,
    changeOrderAmount: number,
    clientData: Client,
    depositPercentage: number = 50
  ): Promise<Invoice> {
    const depositAmount = changeOrderAmount * (depositPercentage / 100);
    
    const items: InvoiceItem[] = [
      {
        name: `Change Order: ${changeOrderTitle}`,
        description: `${depositPercentage}% deposit for approved change order`,
        quantity: 1,
        price: depositAmount,
      }
    ];

    const invoiceData: Omit<Invoice, 'id'> = {
      client_id: clientData.id,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
      status: 'draft',
      items,
      notes: `Deposit invoice for Change Order: ${changeOrderTitle}`,
      terms: 'Deposit due within 7 days to proceed with change order work.',
    };

    return await this.createInvoice(invoiceData);
  }

  /**
   * Get invoices for a project
   */
  async getProjectInvoices(projectId: string): Promise<Invoice[]> {
    // In a real implementation, this would filter by project
    const response = await this.makeRequest('/invoices');
    
    // Filter invoices that contain the project ID in notes or items
    return response.filter((invoice: Invoice) => 
      invoice.notes?.includes(projectId) ||
      invoice.items.some(item => item.description.includes(projectId))
    );
  }

  /**
   * Private helper methods
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}, responseType: 'json' | 'blob' = 'json'): Promise<any> {
    const url = `${this.config.baseUrl}/api/v${this.config.version}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`InvoicePlane API error: ${response.status} ${response.statusText}`);
    }

    if (responseType === 'blob') {
      return await response.blob();
    }

    return await response.json();
  }
}

// Integration helpers for FieldTime
export class FieldTimeInvoiceIntegration {
  private invoicePlane: InvoicePlaneService;

  constructor(config: InvoicePlaneConfig) {
    this.invoicePlane = new InvoicePlaneService(config);
  }

  /**
   * Sync FieldTime project data to InvoicePlane
   */
  async syncProjectToInvoicing(project: any, client: any): Promise<Client> {
    const clientData: Omit<Client, 'id'> = {
      name: `${client.profile.first_name} ${client.profile.last_name}`,
      email: client.profile.email,
      phone: client.profile.phone,
      address: project.address,
      company: client.profile.company,
    };

    return await this.invoicePlane.createClient(clientData);
  }

  /**
   * Create progress billing invoice
   */
  async createProgressBilling(
    projectId: string,
    projectName: string,
    completedWork: Array<{
      description: string;
      amount: number;
      percentage: number;
    }>,
    clientId: string
  ): Promise<Invoice> {
    const items: InvoiceItem[] = completedWork.map(work => ({
      name: work.description,
      description: `${work.percentage}% completion - ${projectName}`,
      quantity: 1,
      price: work.amount,
    }));

    const invoiceData: Omit<Invoice, 'id'> = {
      client_id: clientId,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      items,
      notes: `Progress billing for ${projectName} - Project ID: ${projectId}`,
      terms: 'Payment due within 30 days of invoice date.',
    };

    return await this.invoicePlane.createInvoice(invoiceData);
  }
}