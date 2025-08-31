'use client';

import { useState, useEffect } from 'react';
import { Project } from '@contractor-platform/types';
import Link from 'next/link';
import { useAppStore } from '@/store';
import { 
  Plus, 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Clock,
  BarChart3,
  FileText,
  MessageSquare,
  X
} from 'lucide-react';

export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get current user and role from global state
  const currentUser = useAppStore((state) => state.currentUser);
  const userRole = useAppStore((state) => state.userRole);
  
  // Filter projects based on user role
  const projects = allProjects.filter(project => {
    if (!currentUser) return [];
    
    if (userRole === 'contractor' || userRole === 'staff' || userRole === 'admin') {
      // Contractors see all projects in their tenant
      return true;
    } else if (userRole === 'homeowner') {
      // Homeowners only see their own projects
      return project.client_user_id === currentUser.id;
    } else if (userRole === 'sub') {
      // Subs only see projects they're assigned to (would need assignment data)
      return true; // For now, show all - would filter by assignments
    }
    
    return false;
  });

  useEffect(() => {
    // Sample projects data
    const sampleProjects: Project[] = [
      {
        id: 'proj-1',
        tenant_id: 'tenant-1',
        name: 'Johnson Kitchen Remodel',
        address: '123 Main Street, Richmond, VA 23220',
        status: 'active',
        client_user_id: 'client-1',
        budget: 45000,
        start_date: '2025-01-15',
        end_date: '2025-03-15',
        progress_percentage: 65,
        created_at: '2025-01-10T09:00:00Z',
        updated_at: '2025-02-18T16:30:00Z',
      },
      {
        id: 'proj-2',
        tenant_id: 'tenant-1',
        name: 'Wilson Bathroom Renovation',
        address: '456 Oak Avenue, Midlothian, VA 23113',
        status: 'active',
        client_user_id: 'client-2',
        budget: 25000,
        start_date: '2025-02-01',
        end_date: '2025-04-01',
        progress_percentage: 30,
        created_at: '2025-01-25T14:00:00Z',
        updated_at: '2025-02-10T11:20:00Z',
      },
      {
        id: 'proj-3',
        tenant_id: 'tenant-1',
        name: 'Davis Deck Construction',
        address: '789 Pine Road, Glen Allen, VA 23060',
        status: 'planning',
        client_user_id: 'client-3',
        budget: 18000,
        start_date: '2025-04-15',
        end_date: '2025-05-20',
        progress_percentage: 10,
        created_at: '2025-02-15T10:30:00Z',
        updated_at: '2025-02-15T10:30:00Z',
      },
    ];
    
    setAllProjects(sampleProjects);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">
            Manage your construction projects, track progress, and coordinate teams
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(projects.reduce((acc, p) => acc + (p.budget || 0), 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(projects.reduce((acc, p) => acc + p.progress_percentage, 0) / projects.length)}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Projects List/Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="truncate">{project.address}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress_percentage)}`}
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>{formatCurrency(project.budget || 0)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{project.end_date ? formatDate(project.end_date) : 'No deadline'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Link
                    href={`/calendar?project=${project.id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Schedule
                  </Link>
                  <Link
                    href={`/chat?project=${project.id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chat
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="divide-y">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{project.address}</span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>{formatCurrency(project.budget || 0)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{project.end_date ? formatDate(project.end_date) : 'No deadline'}</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        <span>{project.progress_percentage}% complete</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/calendar?project=${project.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/chat?project=${project.id}`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/documents?project=${project.id}`}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProject.name}
                </h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Project Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                        {selectedProject.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">{formatCurrency(selectedProject.budget || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {selectedProject.start_date ? formatDate(selectedProject.start_date) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">
                        {selectedProject.end_date ? formatDate(selectedProject.end_date) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{selectedProject.progress_percentage}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/calendar?project=${selectedProject.id}`}
                      className="w-full flex items-center px-3 py-2 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Schedule
                    </Link>
                    <Link
                      href={`/chat?project=${selectedProject.id}`}
                      className="w-full flex items-center px-3 py-2 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Project Chat
                    </Link>
                    <Link
                      href={`/documents?project=${selectedProject.id}`}
                      className="w-full flex items-center px-3 py-2 text-left bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Documents
                    </Link>
                    <button className="w-full flex items-center px-3 py-2 text-left bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}