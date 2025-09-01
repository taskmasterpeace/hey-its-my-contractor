'use client';

import { useState } from 'react';
import { ExternalLink, RefreshCw, Settings, DollarSign, FileText, Send } from 'lucide-react';

export function InvoicePlaneIntegration() {
  const [isConnected, setIsConnected] = useState(true); // Mock connection status
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  const mockInvoicePlaneData = {
    totalInvoices: 24,
    paidInvoices: 18,
    pendingInvoices: 4,
    overdueInvoices: 2,
    monthlyRevenue: 42000,
    connectionStatus: 'Connected',
    lastSync: '2025-01-29T14:30:00Z',
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    // Simulate sync process
    setTimeout(() => {
      setIsSyncing(false);
      console.log('InvoicePlane sync completed');
    }, 2000);
  };

  const handleOpenInvoicePlane = () => {
    // Open InvoicePlane in new window
    window.open('http://localhost:8080', '_blank');
  };

  const handleCreateInvoice = () => {
    setShowCreateInvoice(true);
  };

  const handleSendReminders = () => {
    alert('Sending payment reminders to 3 overdue invoices...\n\n✅ Reminder sent to John Smith - Invoice #2025-001\n✅ Reminder sent to Emily Wilson - Invoice #2025-002\n✅ Reminder sent to Mike Davis - Invoice #2024-089');
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">InvoicePlane Integration</h3>
            <p className="text-sm text-gray-600">MIT Licensed • Self-hosted invoicing system</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{mockInvoicePlaneData.connectionStatus}</span>
          </div>
          
          <button
            onClick={handleOpenInvoicePlane}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Open InvoicePlane Dashboard"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:animate-spin"
            title="Sync with InvoicePlane"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{mockInvoicePlaneData.totalInvoices}</p>
          <p className="text-sm text-blue-700">Total Invoices</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{mockInvoicePlaneData.paidInvoices}</p>
          <p className="text-sm text-green-700">Paid</p>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{mockInvoicePlaneData.pendingInvoices}</p>
          <p className="text-sm text-yellow-700">Pending</p>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{mockInvoicePlaneData.overdueInvoices}</p>
          <p className="text-sm text-red-700">Overdue</p>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Monthly Revenue (InvoicePlane)</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(mockInvoicePlaneData.monthlyRevenue)}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button 
          onClick={handleCreateInvoice}
          className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
        
        <button 
          onClick={handleSendReminders}
          className="flex items-center justify-center space-x-2 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Send Reminders</span>
        </button>
        
        <button
          onClick={handleOpenInvoicePlane}
          className="flex items-center justify-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Manage Settings</span>
        </button>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Invoice #2025-001 paid</span>
            <span className="text-green-600 font-medium">{formatCurrency(12500)}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Invoice #2025-002 sent to client</span>
            <span className="text-blue-600 font-medium">{formatCurrency(8200)}</span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Invoice #2025-003 created</span>
            <span className="text-gray-600 font-medium">{formatCurrency(6800)}</span>
          </div>
        </div>
      </div>

      {/* Last Sync */}
      <div className="mt-6 pt-4 border-t text-center">
        <p className="text-xs text-gray-500">
          Last synced: {formatDate(mockInvoicePlaneData.lastSync)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          InvoicePlane running on localhost:8080
        </p>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Invoice</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Johnson Kitchen Remodel</option>
                  <option>Wilson Bathroom</option>
                  <option>Davis Deck Construction</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Progress Billing</option>
                  <option>Final Invoice</option>
                  <option>Change Order</option>
                  <option>Materials Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('✅ Invoice created successfully!\n\nInvoice #2025-004 for Johnson Kitchen Remodel\nAmount: $5,500\nStatus: Draft\n\n📧 Client notification sent');
                  setShowCreateInvoice(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}