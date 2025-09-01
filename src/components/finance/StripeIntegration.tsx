'use client';

import { useState } from 'react';
import { CreditCard, RefreshCw, Settings, DollarSign, FileText, Send, CheckCircle } from 'lucide-react';

export function StripeIntegration() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const mockStripeData = {
    totalProcessed: 145000,
    thisMonthProcessed: 42000,
    pendingPayouts: 8500,
    successfulPayments: 97,
    connectionStatus: 'Connected',
    lastSync: '2025-01-29T16:45:00Z',
    stripeAccountId: 'acct_1234567890',
  };

  const handleCreatePaymentLink = () => {
    setShowPaymentModal(true);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('✅ Stripe sync completed!\n\n• 3 new payments processed\n• 1 payout pending\n• All invoices updated');
    }, 2000);
  };

  const handleOpenStripeDashboard = () => {
    window.open('https://dashboard.stripe.com', '_blank');
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
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Stripe Payment Processing</h3>
            <p className="text-sm text-gray-600">Online payments • Invoicing • Subscriptions</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{mockStripeData.connectionStatus}</span>
          </div>
          
          <button
            onClick={handleOpenStripeDashboard}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Open Stripe Dashboard"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:animate-spin"
            title="Sync with Stripe"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(mockStripeData.totalProcessed)}</p>
          <p className="text-sm text-purple-700">Total Processed</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(mockStripeData.thisMonthProcessed)}</p>
          <p className="text-sm text-green-700">This Month</p>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(mockStripeData.pendingPayouts)}</p>
          <p className="text-sm text-blue-700">Pending Payout</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-2xl font-bold text-orange-600">{mockStripeData.successfulPayments}</p>
          <p className="text-sm text-orange-700">Successful Payments</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button 
          onClick={handleCreatePaymentLink}
          className="flex items-center justify-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          <span>Create Payment Link</span>
        </button>
        
        <button 
          onClick={() => alert('📊 Generating payment report...\n\n✅ Monthly report created\n✅ Exported to PDF\n✅ QuickBooks sync ready')}
          className="flex items-center justify-center space-x-2 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Report</span>
        </button>
        
        <button
          onClick={handleOpenStripeDashboard}
          className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Stripe Dashboard</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Recent Stripe Transactions</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">Johnson Kitchen - Progress Payment</span>
            </div>
            <span className="text-green-600 font-medium">{formatCurrency(12500)}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">Wilson Bathroom - Deposit</span>
            </div>
            <span className="text-green-600 font-medium">{formatCurrency(5000)}</span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700">Davis Deck - Change Order</span>
            </div>
            <span className="text-blue-600 font-medium">{formatCurrency(2800)}</span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="mt-6 pt-4 border-t text-center">
        <p className="text-xs text-gray-500">
          Account: {mockStripeData.stripeAccountId} • Last sync: {formatDate(mockStripeData.lastSync)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Stripe Dashboard • Secure payment processing
        </p>
      </div>

      {/* Payment Link Creator Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Payment Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>John Smith - Johnson Kitchen</option>
                  <option>Emily Wilson - Wilson Bathroom</option>
                  <option>Mike Davis - Davis Deck</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Progress Payment</option>
                  <option>Final Payment</option>
                  <option>Change Order Deposit</option>
                  <option>Material Deposit</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  placeholder="Payment description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('✅ Stripe Payment Link Created!\n\nLink: https://pay.stripe.com/abc123\n📧 Email sent to client\n💳 Ready for payment\n\n🔗 Link copied to clipboard');
                  setShowPaymentModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}