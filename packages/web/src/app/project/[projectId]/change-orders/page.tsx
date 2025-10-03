'use client';

import { useState, useEffect } from 'react';
import { ChangeOrder } from '@contractor-platform/types';
import { ChangeOrderCard } from '@/components/change-orders/ChangeOrderCard';
import { useAppStore } from '@/store';
import { Plus, Filter, Search, TrendingUp, Clock, DollarSign, AlertCircle, FileText } from 'lucide-react';

export default function ChangeOrdersPage() {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currentUser = useAppStore((state) => state.currentUser);
  const userRole = useAppStore((state) => state.userRole);

  useEffect(() => {
    // Sample change orders
    const sampleChangeOrders: ChangeOrder[] = [
      {
        id: '1',
        project_id: 'proj-1',
        title: 'Upgrade to Quartz Countertops',
        description: 'Replace laminate countertops with engineered quartz throughout kitchen',
        amount: 3500,
        status: 'pending',
        linked_meeting_id: 'meeting-1',
        approved_by_client: undefined,
        approved_by_contractor: 'contractor-1',
        created_at: '2025-01-20T10:00:00Z',
        updated_at: '2025-01-20T10:00:00Z',
      },
      {
        id: '2',
        project_id: 'proj-1',
        title: 'Add Under-Cabinet LED Lighting',
        description: 'Install LED strip lighting under all upper cabinets with dimmer controls',
        amount: 850,
        status: 'approved',
        linked_meeting_id: 'meeting-2',
        approved_by_client: 'client-1',
        approved_by_contractor: 'contractor-1',
        approved_at: '2025-01-18T14:30:00Z',
        created_at: '2025-01-15T16:20:00Z',
        updated_at: '2025-01-18T14:30:00Z',
      },
      {
        id: '3',
        project_id: 'proj-2',
        title: 'Upgrade Shower Fixtures',
        description: 'Replace standard fixtures with brushed gold rain shower head and fixtures',
        amount: 1200,
        status: 'implemented',
        approved_by_client: 'client-2',
        approved_by_contractor: 'contractor-1',
        approved_at: '2025-01-10T11:15:00Z',
        created_at: '2025-01-08T09:30:00Z',
        updated_at: '2025-01-12T16:45:00Z',
      },
    ];

    setChangeOrders(sampleChangeOrders);
  }, []);

  // Filter change orders based on user role
  const getClientProjectId = (clientId: string): string => {
    const projectMapping: Record<string, string> = {
      'client-1': 'proj-1', // John Smith → Johnson Kitchen
      'client-2': 'proj-2', // Emily Wilson → Wilson Bathroom
      'client-3': 'proj-3', // Davis → Deck Construction
    };
    return projectMapping[clientId] || '';
  };

  const filteredChangeOrders = changeOrders.filter(co => {
    // Role-based filtering
    if (userRole === 'homeowner' && currentUser) {
      const clientProjectId = getClientProjectId(currentUser.id);
      if (co.project_id !== clientProjectId) {
        return false;
      }
    }

    // Status filtering
    if (filterStatus !== 'all' && co.status !== filterStatus) {
      return false;
    }

    // Search filtering
    if (searchTerm.trim() && !co.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Calculate stats for dashboard
  const totalValue = filteredChangeOrders.reduce((sum, co) => sum + co.amount, 0);
  const pendingCount = filteredChangeOrders.filter(co => co.status === 'pending').length;
  const approvedValue = filteredChangeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + co.amount, 0);
  const implementedValue = filteredChangeOrders.filter(co => co.status === 'implemented').reduce((sum, co) => sum + co.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAcknowledge = (coId: string) => {
    setChangeOrders(prev => 
      prev.map(co => 
        co.id === coId 
          ? { ...co, status: 'approved' as const, approved_by_client: currentUser?.id }
          : co
      )
    );
  };

  const handleSign = (coId: string) => {
    console.log('Sign change order:', coId);
    // Would open e-signature workflow
  };

  const handlePay = (coId: string) => {
    console.log('Pay change order:', coId);
    // Would open payment interface
  };

  const handleViewPdf = (coId: string) => {
    console.log('View PDF for change order:', coId);
    // Would open PDF viewer
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Orders</h1>
          <p className="text-gray-600">
            Manage project changes, approvals, and additional work requests
          </p>
        </div>
        
        {(userRole === 'contractor' || userRole === 'staff') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Change Order
          </button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(approvedValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(implementedValue)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search change orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Change Orders List */}
      <div className="space-y-4">
        {filteredChangeOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No change orders found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first change order to get started'
              }
            </p>
          </div>
        ) : (
          filteredChangeOrders.map((co) => (
            <ChangeOrderCard
              key={co.id}
              changeOrder={co}
              variant="detailed"
              currentUserRole={userRole as any}
              onAcknowledge={() => handleAcknowledge(co.id)}
              onSign={() => handleSign(co.id)}
              onPay={() => handlePay(co.id)}
              onViewPdf={() => handleViewPdf(co.id)}
            />
          ))
        )}
      </div>

      {/* Create Change Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Change Order</h3>
            <p className="text-gray-600 mb-4">
              Change order creation form will be implemented next.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}