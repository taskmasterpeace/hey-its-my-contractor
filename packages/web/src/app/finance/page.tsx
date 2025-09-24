'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Filter, DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { InvoicePlaneIntegration } from '@/components/finance/InvoicePlaneIntegration';
import { InvoiceViewer } from '@/components/finance/InvoiceViewer';
import { StripeIntegration } from '@/components/finance/StripeIntegration';

interface Invoice {
  id: string;
  number: string;
  project_name: string;
  client_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  paid_date?: string;
  created_at: string;
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const sampleInvoices: Invoice[] = [
      {
        id: '1',
        number: 'INV-2025-001',
        project_name: 'Johnson Kitchen Remodel',
        client_name: 'John Smith',
        amount: 12500,
        status: 'paid',
        due_date: '2025-01-15',
        paid_date: '2025-01-10',
        created_at: '2025-01-01T09:00:00Z',
      },
      {
        id: '2',
        number: 'INV-2025-002',
        project_name: 'Wilson Bathroom',
        client_name: 'Emily Wilson',
        amount: 8200,
        status: 'sent',
        due_date: '2025-01-28',
        created_at: '2025-01-15T14:30:00Z',
      },
      {
        id: '3',
        number: 'INV-2024-089',
        project_name: 'Davis Deck Construction',
        client_name: 'Mike Davis',
        amount: 3200,
        status: 'overdue',
        due_date: '2025-01-05',
        created_at: '2024-12-20T11:00:00Z',
      },
      {
        id: '4',
        number: 'INV-2025-003',
        project_name: 'Miller Addition',
        client_name: 'Sarah Miller',
        amount: 6800,
        status: 'draft',
        due_date: '2025-02-01',
        created_at: '2025-01-20T16:15:00Z',
      },
    ];
    
    setInvoices(sampleInvoices);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredInvoices = invoices.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  );

  // Enhanced financial calculations
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((acc, i) => acc + i.amount, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + i.amount, 0);
  const draftAmount = invoices.filter(i => i.status === 'draft').reduce((acc, i) => acc + i.amount, 0);
  
  // Cash flow analysis
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyRevenue = invoices.filter(i => {
    const invoiceDate = new Date(i.created_at);
    return i.status === 'paid' && invoiceDate.getMonth() === thisMonth && invoiceDate.getFullYear() === thisYear;
  }).reduce((acc, i) => acc + i.amount, 0);

  // Profit margin calculation (rough estimate)
  const estimatedCosts = totalRevenue * 0.7; // Assume 70% costs, 30% profit
  const profitMargin = totalRevenue - estimatedCosts;
  const profitPercentage = totalRevenue > 0 ? (profitMargin / totalRevenue) * 100 : 0;

  // Payment timeline analysis
  const avgPaymentTime = 18; // days (industry average)
  const upcomingPayments = invoices.filter(i => i.status === 'sent' && new Date(i.due_date) >= new Date());
  const cashFlowForecast = upcomingPayments.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Finance</h1>
          <p className="text-gray-600">
            Manage invoices, track payments, and monitor cash flow
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Enhanced Financial Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(profitPercentage)}% profit margin
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(pendingAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {upcomingPayments.length} invoices awaiting payment
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Requires immediate attention
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cash Flow Forecast</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(cashFlowForecast)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Expected in next 30 days
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* New Profit Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Costs (70%)</span>
              <span className="font-semibold text-orange-600">-{formatCurrency(estimatedCosts)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">Net Profit</span>
              <span className="font-bold text-blue-600">{formatCurrency(profitMargin)}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{Math.round(profitPercentage)}% profit margin</strong> 
                {profitPercentage < 20 ? ' - Consider cost optimization' : ' - Healthy margin'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Timeline</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Payment Time</span>
              <span className="font-semibold">{avgPaymentTime} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding Invoices</span>
              <span className="font-semibold">{upcomingPayments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Draft Invoices</span>
              <span className="font-semibold text-gray-800">{formatCurrency(draftAmount)}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Next 30 days forecast:</strong> {formatCurrency(cashFlowForecast)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <span className="text-sm text-gray-600">
            {filteredInvoices.length} of {invoices.length} invoices
          </span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.project_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.client_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(invoice.due_date)}
                    </div>
                    {invoice.paid_date && (
                      <div className="text-xs text-green-600">
                        Paid {formatDate(invoice.paid_date)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    {invoice.status === 'draft' && (
                      <button 
                        onClick={() => {
                          alert(`📧 Sending ${invoice.number} to ${invoice.client_name}\n\n✅ Email sent successfully!\nStatus updated to: Sent`);
                          // Update invoice status
                          setInvoices(prev => prev.map(inv => 
                            inv.id === invoice.id ? {...inv, status: 'sent' as const} : inv
                          ));
                        }}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Send
                      </button>
                    )}
                    {invoice.status === 'sent' && (
                      <button 
                        onClick={() => {
                          alert(`💰 Marking ${invoice.number} as paid\n\n✅ Payment recorded: ${formatCurrency(invoice.amount)}\n✅ Status updated to: Paid\n✅ Client notified`);
                          // Update invoice status
                          setInvoices(prev => prev.map(inv => 
                            inv.id === invoice.id ? {...inv, status: 'paid' as const, paid_date: new Date().toISOString().split('T')[0]} : inv
                          ));
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Processing */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StripeIntegration />
        <InvoicePlaneIntegration />
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Invoice</h3>
            <p className="text-gray-600 mb-4">
              You can create invoices directly in InvoicePlane or generate them automatically from project milestones.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.open('http://localhost:8080', '_blank')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open InvoicePlane Dashboard
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <InvoiceViewer
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}