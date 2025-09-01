'use client';

import { DollarSign, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useAppStore } from '@/store';

interface PaymentStatusWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
}

export function PaymentStatusWidget({ onRemove, isEditMode }: PaymentStatusWidgetProps) {
  const userRole = useAppStore((state) => state.userRole);

  const getPaymentData = () => {
    if (userRole === 'homeowner') {
      return {
        totalPaid: 29250,
        pendingAmount: 5500,
        nextPayment: {
          amount: 8500,
          dueDate: '2025-02-05',
          description: 'Cabinet installation milestone'
        },
        recentPayments: [
          { amount: 12500, date: '2025-01-15', description: 'Progress payment #2' },
          { amount: 16750, date: '2025-01-01', description: 'Initial deposit' }
        ]
      };
    } else {
      return {
        totalReceived: 125000,
        pendingCollection: 28500,
        nextCollection: {
          amount: 12500,
          dueDate: '2025-02-01',
          description: 'Johnson Kitchen milestone'
        },
        recentPayments: [
          { amount: 8200, date: '2025-01-28', description: 'Wilson Bathroom progress' },
          { amount: 12500, date: '2025-01-25', description: 'Johnson Kitchen cabinet deposit' }
        ]
      };
    }
  };

  const paymentData = getPaymentData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">
            {userRole === 'homeowner' ? 'Payment Status' : 'Cash Flow'}
          </h3>
        </div>
        
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Payment Summary */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(userRole === 'homeowner' ? paymentData.totalPaid : paymentData.totalReceived)}
            </p>
            <p className="text-xs text-green-700">
              {userRole === 'homeowner' ? 'Total Paid' : 'Total Received'}
            </p>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-lg font-bold text-yellow-600">
              {formatCurrency(userRole === 'homeowner' ? paymentData.pendingAmount : paymentData.pendingCollection)}
            </p>
            <p className="text-xs text-yellow-700">
              {userRole === 'homeowner' ? 'Pending' : 'To Collect'}
            </p>
          </div>
        </div>

        {/* Next Payment */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {userRole === 'homeowner' ? 'Next Payment Due' : 'Next Collection Expected'}
                </p>
                <p className="text-xs text-blue-700">{paymentData.nextPayment?.description || paymentData.nextCollection?.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-900">
                {formatCurrency(paymentData.nextPayment?.amount || paymentData.nextCollection?.amount)}
              </p>
              <p className="text-xs text-blue-700">
                Due {formatDate(paymentData.nextPayment?.dueDate || paymentData.nextCollection?.dueDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {paymentData.recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-900">{payment.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 border-t bg-gray-50">
        {userRole === 'homeowner' ? (
          <button className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <DollarSign className="w-4 h-4 mr-2" />
            Make Payment
          </button>
        ) : (
          <button className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <DollarSign className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        )}
      </div>
    </div>
  );
}