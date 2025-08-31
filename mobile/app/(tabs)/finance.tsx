import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FinanceScreen() {
  const financialSummary = {
    totalRevenue: '$145,000',
    pendingInvoices: '$28,500',
    paidThisMonth: '$42,000',
    overdue: '$3,200',
  };

  const recentInvoices = [
    {
      id: '1',
      invoiceNumber: 'INV-2025-001',
      client: 'Johnson Kitchen',
      amount: '$12,500',
      status: 'paid',
      dueDate: '2025-01-15',
      paidDate: '2025-01-10',
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-002',
      client: 'Miller Bathroom',
      amount: '$8,200',
      status: 'pending',
      dueDate: '2025-01-28',
      paidDate: null,
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-089',
      client: 'Davis Deck',
      amount: '$3,200',
      status: 'overdue',
      dueDate: '2025-01-05',
      paidDate: null,
    },
    {
      id: '4',
      invoiceNumber: 'INV-2025-003',
      client: 'Wilson Garage',
      amount: '$6,800',
      status: 'draft',
      dueDate: '2025-02-01',
      paidDate: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#059669';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#DC2626';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'paid': return '#D1FAE5';
      case 'pending': return '#FEF3C7';
      case 'overdue': return '#FEE2E2';
      case 'draft': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Financial Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={[styles.summaryAmount, { color: '#059669' }]}>
            {financialSummary.totalRevenue}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryAmount, { color: '#F59E0B' }]}>
            {financialSummary.pendingInvoices}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={[styles.summaryAmount, { color: '#2563EB' }]}>
            {financialSummary.paidThisMonth}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Overdue</Text>
          <Text style={[styles.summaryAmount, { color: '#DC2626' }]}>
            {financialSummary.overdue}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Create Invoice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="card" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Record Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Invoices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentInvoices.map((invoice) => (
          <TouchableOpacity key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                <Text style={styles.clientName}>{invoice.client}</Text>
              </View>
              <View style={styles.invoiceAmount}>
                <Text style={styles.amountText}>{invoice.amount}</Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusBackground(invoice.status) }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { color: getStatusColor(invoice.status) }
                  ]}>
                    {invoice.status}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.invoiceFooter}>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.dateText}>
                  Due: {invoice.dueDate}
                  {invoice.paidDate && ` • Paid: ${invoice.paidDate}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Financial Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Tools</Text>
        
        <TouchableOpacity style={styles.toolCard}>
          <Ionicons name="bar-chart-outline" size={24} color="#2563EB" />
          <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Revenue Report</Text>
            <Text style={styles.toolDescription}>Monthly and quarterly revenue analysis</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <Ionicons name="calculator-outline" size={24} color="#059669" />
          <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Expense Tracker</Text>
            <Text style={styles.toolDescription}>Track materials and labor costs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <Ionicons name="document-text-outline" size={24} color="#7C3AED" />
          <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Tax Documents</Text>
            <Text style={styles.toolDescription}>Generate tax-ready financial reports</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard}>
          <Ionicons name="time-outline" size={24} color="#F59E0B" />
          <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>Payment Reminders</Text>
            <Text style={styles.toolDescription}>Automated follow-up for overdue invoices</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#6B7280',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolContent: {
    flex: 1,
    marginLeft: 16,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});