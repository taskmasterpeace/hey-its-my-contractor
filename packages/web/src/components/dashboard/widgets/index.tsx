// Export all dashboard widgets
export { LatestPhotosWidget } from './LatestPhotosWidget';
export { MessageCenterWidget } from './MessageCenterWidget';
export { TodaysScheduleWidget } from './TodaysScheduleWidget';
export { ProjectProgressWidget } from './ProjectProgressWidget';
export { PaymentStatusWidget } from './PaymentStatusWidget';

// Placeholder widgets - simple implementations
import { X } from 'lucide-react';

export const WeatherWidget = ({ onRemove, isEditMode }: any) => (
  <div className="h-full flex items-center justify-center bg-blue-50 text-blue-700 relative">
    <div>🌤️ Weather Widget</div>
    {isEditMode && onRemove && (
      <button onClick={onRemove} className="absolute top-2 right-2">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const ChangeOrderWidget = ({ onRemove, isEditMode }: any) => (
  <div className="h-full flex items-center justify-center bg-purple-50 text-purple-700 relative">
    <div>📋 Change Orders Widget</div>
    {isEditMode && onRemove && (
      <button onClick={onRemove} className="absolute top-2 right-2">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const MeetingSummaryWidget = ({ onRemove, isEditMode }: any) => (
  <div className="h-full flex items-center justify-center bg-orange-50 text-orange-700 relative">
    <div>🎤 Meeting Summary Widget</div>
    {isEditMode && onRemove && (
      <button onClick={onRemove} className="absolute top-2 right-2">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const DocumentActivityWidget = ({ onRemove, isEditMode }: any) => (
  <div className="h-full flex items-center justify-center bg-gray-50 text-gray-700 relative">
    <div>📄 Document Activity Widget</div>
    {isEditMode && onRemove && (
      <button onClick={onRemove} className="absolute top-2 right-2">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const TeamStatusWidget = ({ onRemove, isEditMode }: any) => (
  <div className="h-full flex items-center justify-center bg-green-50 text-green-700 relative">
    <div>👥 Team Status Widget</div>
    {isEditMode && onRemove && (
      <button onClick={onRemove} className="absolute top-2 right-2">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);