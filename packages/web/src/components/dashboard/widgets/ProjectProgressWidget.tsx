'use client';

import { TrendingUp, Calendar, DollarSign, Users, X } from 'lucide-react';
import { useAppStore } from '@/store';

interface ProjectProgressWidgetProps {
  onRemove?: () => void;
  isEditMode?: boolean;
}

export function ProjectProgressWidget({ onRemove, isEditMode }: ProjectProgressWidgetProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const userRole = useAppStore((state) => state.userRole);

  // Mock project data based on user role
  const getProjectData = () => {
    if (userRole === 'homeowner' && currentUser?.id === 'client-1') {
      // John Smith sees only Johnson Kitchen
      return [{
        id: 'proj-1',
        name: 'Your Kitchen Remodel',
        progress: 65,
        daysRemaining: 25,
        budget: 45000,
        spent: 29250,
        nextMilestone: 'Cabinet Installation',
        status: 'on-track'
      }];
    } else if (userRole === 'homeowner' && currentUser?.id === 'client-2') {
      // Emily Wilson sees only Wilson Bathroom
      return [{
        id: 'proj-2', 
        name: 'Your Bathroom Renovation',
        progress: 30,
        daysRemaining: 42,
        budget: 25000,
        spent: 7500,
        nextMilestone: 'Tile Installation', 
        status: 'behind-schedule'
      }];
    } else {
      // Contractors see all projects
      return [
        {
          id: 'proj-1',
          name: 'Johnson Kitchen Remodel',
          progress: 65,
          daysRemaining: 25,
          budget: 45000,
          spent: 29250,
          nextMilestone: 'Cabinet Installation',
          status: 'on-track'
        },
        {
          id: 'proj-2',
          name: 'Wilson Bathroom Renovation', 
          progress: 30,
          daysRemaining: 42,
          budget: 25000,
          spent: 7500,
          nextMilestone: 'Tile Installation',
          status: 'behind-schedule'
        },
        {
          id: 'proj-3',
          name: 'Davis Deck Construction',
          progress: 10,
          daysRemaining: 85,
          budget: 18000,
          spent: 1800,
          nextMilestone: 'Permit Approval',
          status: 'waiting'
        }
      ];
    }
  };

  const projects = getProjectData();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100';
      case 'behind-schedule': return 'text-orange-600 bg-orange-100';
      case 'waiting': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">
            {userRole === 'homeowner' ? 'Your Project' : 'Project Progress'}
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

      {/* Project Cards */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {projects.map((project) => (
          <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('-', ' ')}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-900 font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-gray-600">Days Remaining</p>
                  <p className="font-medium text-gray-900">{project.daysRemaining}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-gray-600">Budget Used</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Milestone */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Next Milestone</p>
                  <p className="text-sm font-medium text-gray-900">{project.nextMilestone}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {userRole !== 'homeowner' && (
        <div className="p-4 border-t bg-gray-50">
          <button className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Users className="w-4 h-4 mr-2" />
            Update Progress
          </button>
        </div>
      )}
    </div>
  );
}