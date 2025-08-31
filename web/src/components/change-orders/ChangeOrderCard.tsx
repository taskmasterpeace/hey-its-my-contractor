'use client';

import { useState } from 'react';
import { ChangeOrder } from '@contractor-platform/types';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  FileText, 
  CreditCard,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Users
} from 'lucide-react';

interface ChangeOrderCardProps {
  changeOrder: ChangeOrder;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onAcknowledge?: () => void;
  onSign?: () => void;
  onPay?: () => void;
  onViewPdf?: () => void;
  currentUserRole?: 'contractor' | 'homeowner' | 'staff';
}

export function ChangeOrderCard({
  changeOrder,
  variant = 'default',
  showActions = true,
  onAcknowledge,
  onSign,
  onPay,
  onViewPdf,
  currentUserRole = 'contractor'
}: ChangeOrderCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'implemented':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'DRAFT';
      case 'pending': return 'SENT';
      case 'approved': return 'ACKED';
      case 'rejected': return 'REJECTED';
      case 'implemented': return 'PAID';
      default: return status.toUpperCase();
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

  // Mock data for demo purposes
  const mockCostBreakdown = {
    labor: 2000,
    materials: changeOrder.amount - 2000 - 500 - 300,
    fees: 500,
    tax: 300,
    contingency: 0,
  };

  const mockScheduleImpact = {
    daysDelta: 5,
    affectedMilestones: ['Cabinet Installation', 'Final Walkthrough'],
    beforeDate: '2025-03-15',
    afterDate: '2025-03-20',
  };

  const mockAttachments = [
    { id: '1', name: 'Reference Image - Window Trim.jpg', type: 'image' },
    { id: '2', name: 'Updated Plan Markup.pdf', type: 'pdf' },
  ];

  const mockMeetingLink = {
    date: 'Aug 8',
    time: '2:00p',
    meetingId: 'meeting-123',
  };

  const mockAuditTrail = [
    { user: 'Mike Johnson', action: 'Created', timestamp: '2025-01-20T10:00:00Z' },
    { user: 'John Smith', action: 'Viewed', timestamp: '2025-01-20T14:30:00Z' },
    { user: 'John Smith', action: 'Acknowledged', timestamp: '2025-01-20T15:45:00Z' },
  ];

  const getActionButtons = () => {
    const buttons = [];

    if (changeOrder.status === 'pending' && currentUserRole === 'homeowner') {
      buttons.push(
        <button
          key="ack"
          onClick={onAcknowledge}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <CheckCircle className="w-4 h-4 mr-1 inline" />
          Acknowledge
        </button>
      );
    }

    if (changeOrder.status === 'approved' && (currentUserRole === 'contractor' || currentUserRole === 'homeowner')) {
      buttons.push(
        <button
          key="sign"
          onClick={onSign}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Edit className="w-4 h-4 mr-1 inline" />
          Sign
        </button>
      );
    }

    if (changeOrder.status === 'approved' && changeOrder.approved_by_client && currentUserRole === 'homeowner') {
      buttons.push(
        <button
          key="pay"
          onClick={onPay}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <CreditCard className="w-4 h-4 mr-1 inline" />
          Pay Now
        </button>
      );
    }

    buttons.push(
      <button
        key="pdf"
        onClick={onViewPdf}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        <FileText className="w-4 h-4 mr-1 inline" />
        View PDF
      </button>
    );

    return buttons;
  };

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{changeOrder.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                +{formatCurrency(changeOrder.amount)}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                +{mockScheduleImpact.daysDelta} days
              </span>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(changeOrder.status)}`}>
            {getStatusLabel(changeOrder.status)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{changeOrder.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{changeOrder.description}</p>
            
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                <span className="font-medium text-green-600">+{formatCurrency(changeOrder.amount)}</span>
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1 text-orange-600" />
                <span className="font-medium text-orange-600">+{mockScheduleImpact.daysDelta} days</span>
              </span>
            </div>
          </div>
          
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(changeOrder.status)}`}>
            {getStatusLabel(changeOrder.status)}
          </span>
        </div>
      </div>

      {/* Cost Breakdown Accordion */}
      <div className="px-6 py-4 border-b">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-left"
        >
          <h4 className="font-medium text-gray-900">Cost Breakdown</h4>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showDetails && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Labor</span>
              <span className="font-medium">{formatCurrency(mockCostBreakdown.labor)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Materials</span>
              <span className="font-medium">{formatCurrency(mockCostBreakdown.materials)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Permits & Fees</span>
              <span className="font-medium">{formatCurrency(mockCostBreakdown.fees)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatCurrency(mockCostBreakdown.tax)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-green-600">{formatCurrency(changeOrder.amount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Impact */}
      <div className="px-6 py-4 border-b">
        <h4 className="font-medium text-gray-900 mb-3">Schedule Impact</h4>
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <p className="text-gray-600">Original Completion</p>
            <p className="font-medium">{formatDate(mockScheduleImpact.beforeDate)}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <span className="text-orange-600 font-medium">+{mockScheduleImpact.daysDelta} days</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-600">New Completion</p>
            <p className="font-medium text-orange-600">{formatDate(mockScheduleImpact.afterDate)}</p>
          </div>
        </div>
        
        <div className="mt-3 text-sm">
          <p className="text-gray-600 mb-1">Affected Milestones:</p>
          <div className="flex flex-wrap gap-1">
            {mockScheduleImpact.affectedMilestones.map((milestone, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs"
              >
                {milestone}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {mockAttachments.length > 0 && (
        <div className="px-6 py-4 border-b">
          <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
          <div className="space-y-2">
            {mockAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900 flex-1">{attachment.name}</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Linkback */}
      <div className="px-6 py-4 border-b bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Discussed in Meeting {mockMeetingLink.date}, {mockMeetingLink.time}
            </span>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Jump to transcript
          </button>
        </div>
      </div>

      {/* Audit Trail */}
      {variant === 'detailed' && (
        <div className="px-6 py-4 border-b">
          <h4 className="font-medium text-gray-900 mb-3">Activity</h4>
          <div className="space-y-2">
            {mockAuditTrail.map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-gray-900">
                    <strong>{activity.user}</strong> {activity.action.toLowerCase()}
                  </span>
                </div>
                <span className="text-gray-500">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {getActionButtons()}
          </div>
        </div>
      )}
    </div>
  );
}