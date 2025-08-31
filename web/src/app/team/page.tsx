'use client';

import { useState, useEffect } from 'react';
import { User } from '@contractor-platform/types';
import { Plus, Mail, Phone, Crown, Shield, Wrench, User as UserIcon } from 'lucide-react';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const sampleTeam: User[] = [
      {
        id: '1',
        tenant_id: 'tenant-1',
        role: 'contractor',
        profile: {
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike@johnsoncontracting.com',
          phone: '555-0101',
          company: 'Johnson Contracting LLC',
          license_number: 'VA-12345',
        },
        auth_id: 'auth-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        tenant_id: 'tenant-1',
        role: 'staff',
        profile: {
          first_name: 'Sarah',
          last_name: 'Davis',
          email: 'sarah@johnsoncontracting.com',
          phone: '555-0102',
          company: 'Johnson Contracting LLC',
        },
        auth_id: 'auth-2',
        created_at: '2025-01-05T00:00:00Z',
        updated_at: '2025-01-05T00:00:00Z',
      },
      {
        id: '3',
        tenant_id: 'tenant-1',
        role: 'sub',
        profile: {
          first_name: 'Tom',
          last_name: 'Rodriguez',
          email: 'tom@electricpro.com',
          phone: '555-0301',
          company: 'Electric Pro LLC',
          license_number: 'EL-67890',
        },
        auth_id: 'auth-3',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
    ];
    
    setTeamMembers(sampleTeam);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'contractor':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'staff':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'sub':
        return <Wrench className="w-5 h-5 text-green-500" />;
      case 'homeowner':
        return <UserIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'contractor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sub':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'homeowner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUserInitials = (user: User) => {
    return `${user.profile.first_name[0]}${user.profile.last_name[0]}`.toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">
            Manage team members, subcontractors, and client access
          </p>
        </div>
        
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {teamMembers.filter(m => m.role === 'staff').length}
            </p>
            <p className="text-sm text-gray-600">Staff</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {teamMembers.filter(m => m.role === 'sub').length}
            </p>
            <p className="text-sm text-gray-600">Subcontractors</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {teamMembers.filter(m => m.role === 'homeowner').length}
            </p>
            <p className="text-sm text-gray-600">Clients</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                    {getUserInitials(member)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {member.profile.first_name} {member.profile.last_name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {member.profile.company && (
                        <p>{member.profile.company}</p>
                      )}
                      {member.profile.license_number && (
                        <p>License: {member.profile.license_number}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                  {member.profile.phone && (
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                  <button className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-sm transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
            <p className="text-gray-600 mb-4">
              Team invitation functionality will be implemented in the next phase.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
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