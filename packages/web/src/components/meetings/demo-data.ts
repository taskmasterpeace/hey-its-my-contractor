// Demo data for realistic contractor meetings
import {
  Meeting,
  UserProfile,
  MeetingTag,
  MeetingSearchResult
} from '@contractor-platform/types';

// Sample Users/Participants
export const sampleParticipants: UserProfile[] = [
  {
    full_name: 'Mike Johnson',
    email: 'mike@fieldtimeconstruction.com',
    phone: '(555) 123-4567',
    avatar_url: undefined,
    company: 'FieldTime Construction',
    license_number: 'C-42-987654',
  },
  {
    full_name: 'Sarah Williams',
    email: 'sarah@fieldtimeconstruction.com',
    phone: '(555) 123-4568',
    avatar_url: undefined,
    company: 'FieldTime Construction',
    license_number: 'C-42-987655',
  },
  {
    full_name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 987-6543',
    avatar_url: undefined,
    company: undefined,
    license_number: undefined,
  },
  {
    full_name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '(555) 987-6544',
    avatar_url: undefined,
    company: undefined,
    license_number: undefined,
  },
  {
    full_name: 'Tom Rodriguez',
    email: 'tom@acmeelectric.com',
    phone: '(555) 456-7890',
    avatar_url: undefined,
    company: 'ACME Electric',
    license_number: 'C-10-123456',
  },
  {
    full_name: 'Lisa Chen',
    email: 'lisa@chenplumbing.com',
    phone: '(555) 789-0123',
    avatar_url: undefined,
    company: 'Chen Plumbing Services',
    license_number: 'C-36-654321',
  },
  {
    full_name: 'David Wilson',
    email: 'david.wilson@cityinspections.gov',
    phone: '(555) 111-2222',
    avatar_url: undefined,
    company: 'City Building Department',
    license_number: undefined,
  },
];

// Sample Tags
export const sampleMeetingTags: MeetingTag[] = [
  { id: 'tag-1', name: 'urgent', color: 'bg-red-100 text-red-700 border-red-200', usage_count: 15, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-2', name: 'electrical', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', usage_count: 23, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-3', name: 'plumbing', color: 'bg-blue-100 text-blue-700 border-blue-200', usage_count: 18, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-4', name: 'permits', color: 'bg-purple-100 text-purple-700 border-purple-200', usage_count: 12, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-5', name: 'inspection', color: 'bg-green-100 text-green-700 border-green-200', usage_count: 20, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-6', name: 'change-order', color: 'bg-orange-100 text-orange-700 border-orange-200', usage_count: 9, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-7', name: 'materials', color: 'bg-gray-100 text-gray-700 border-gray-200', usage_count: 16, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-8', name: 'scheduling', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', usage_count: 14, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-9', name: 'budget', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', usage_count: 11, created_at: '2025-01-10T00:00:00Z' },
  { id: 'tag-10', name: 'client-request', color: 'bg-pink-100 text-pink-700 border-pink-200', usage_count: 7, created_at: '2025-01-10T00:00:00Z' },
];

// Sample Meetings
export const sampleMeetings: Meeting[] = [
  {
    id: 'meeting-1',
    user_id: 'user-1',
    project_id: 'proj-1',
    title: 'Kitchen Remodel - Progress Review Week 4',
    starts_at: '2025-01-22T14:00:00Z',
    ends_at: '2025-01-22T15:30:00Z',
    type: 'progress_review',
    participants: ['user-1', 'user-3', 'user-5'], // Mike, John, Tom
    consent_given: true,
    status: 'completed',
    recording_url: 'https://example.com/recordings/meeting1.wav',
    tags: ['electrical', 'scheduling', 'inspection', 'materials'],
    transcript: 'Electrical rough-in completed. Need to schedule city inspection for Friday. Cabinet delivery confirmed for next Wednesday.',
    created_at: '2025-01-22T13:45:00Z',
    updated_at: '2025-01-22T15:30:00Z',
  },
  {
    id: 'meeting-2',
    user_id: 'user-1',
    project_id: 'proj-2',
    title: 'Davis Master Bathroom - Initial Consultation',
    starts_at: '2025-01-15T15:00:00Z',
    ends_at: '2025-01-15T16:30:00Z',
    type: 'consultation',
    participants: ['user-1', 'user-4'], // Mike, Emily
    consent_given: true,
    status: 'completed',
    recording_url: 'https://example.com/recordings/meeting2.wav',
    tags: ['consultation', 'budget', 'scheduling', 'plumbing'],
    transcript: 'Client wants spa-like bathroom with walk-in shower and double vanity. $28k budget, Easter deadline.',
    created_at: '2025-01-15T14:45:00Z',
    updated_at: '2025-01-15T16:30:00Z',
  },
  {
    id: 'meeting-3',
    user_id: 'user-1',
    project_id: 'proj-1',
    title: 'Kitchen Remodel - Appliance Upgrade Change Order',
    starts_at: '2025-01-24T10:30:00Z',
    ends_at: '2025-01-24T11:30:00Z',
    type: 'change_order',
    participants: ['user-1', 'user-3', 'user-5'], // Mike, John, Tom
    consent_given: true,
    status: 'completed',
    recording_url: 'https://example.com/recordings/meeting3.wav',
    tags: ['change-order', 'electrical', 'budget', 'client-request'],
    transcript: 'Client wants professional-grade range. Requires electrical upgrade and enhanced ventilation. +$3k cost.',
    created_at: '2025-01-24T10:15:00Z',
    updated_at: '2025-01-24T11:30:00Z',
  },
  {
    id: 'meeting-4',
    user_id: 'user-1',
    project_id: 'proj-2',
    title: 'Davis Bathroom - Plumbing Walkthrough',
    starts_at: '2025-01-28T09:00:00Z',
    ends_at: '2025-01-28T10:00:00Z',
    type: 'walkthrough',
    participants: ['user-1', 'user-4', 'user-6'], // Mike, Emily, Lisa
    consent_given: true,
    status: 'completed',
    recording_url: 'https://example.com/recordings/meeting4.wav',
    tags: ['plumbing', 'walkthrough', 'permits'],
    transcript: 'Reviewed rough-in plumbing layout. Client approved fixture locations. Ready for inspection.',
    created_at: '2025-01-28T08:45:00Z',
    updated_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'meeting-5',
    user_id: 'user-1',
    project_id: 'proj-3',
    title: 'Rodriguez Deck - Planning Meeting',
    starts_at: '2025-02-03T13:00:00Z',
    type: 'consultation',
    participants: ['user-1', 'user-2'], // Mike, Sarah
    consent_given: true,
    status: 'scheduled',
    tags: ['planning', 'permits', 'materials'],
    transcript: 'Initial planning session for deck addition project.',
    created_at: '2025-01-30T16:00:00Z',
    updated_at: '2025-01-30T16:00:00Z',
  },
  {
    id: 'meeting-6',
    user_id: 'user-1',
    project_id: 'proj-1',
    title: 'Kitchen Final Inspection',
    starts_at: '2025-02-15T10:00:00Z',
    ends_at: '2025-02-15T11:00:00Z',
    type: 'inspection',
    participants: ['user-1', 'user-3', 'user-7'], // Mike, John, David Wilson
    consent_given: true,
    status: 'scheduled',
    tags: ['inspection', 'final', 'permits'],
    transcript: 'Final city inspection scheduled. All work should be complete by this date.',
    created_at: '2025-01-25T14:00:00Z',
    updated_at: '2025-01-25T14:00:00Z',
  },
];

// Sample Search Results (for demonstrating search functionality)
export const sampleSearchResults: MeetingSearchResult[] = [
  {
    meeting: sampleMeetings[0],
    highlights: {
      title: 'Kitchen Remodel - Progress Review Week 4',
      transcript: [
        {
          segmentIndex: 2,
          text: 'We\'ve completed the electrical rough-in work. Tom and his team did an excellent job running the new circuits for the island and under-cabinet lighting.',
          timestamp: 16.2,
          speaker: 'Mike Johnson',
          highlightedText: 'We\'ve completed the <mark>electrical</mark> rough-in work. Tom and his team did an excellent job running the new circuits for the island and under-cabinet lighting.',
        },
        {
          segmentIndex: 5,
          text: 'I\'ll call the city inspector tomorrow morning. We should be able to get an inspection scheduled for Friday.',
          timestamp: 55.3,
          speaker: 'Mike Johnson',
          highlightedText: 'I\'ll call the city <mark>inspector</mark> tomorrow morning. We should be able to get an <mark>inspection</mark> scheduled for Friday.',
        },
      ],
    },
    relevanceScore: 0.95,
  },
  {
    meeting: sampleMeetings[2],
    highlights: {
      title: 'Kitchen Remodel - Appliance Upgrade Change Order',
      transcript: [
        {
          segmentIndex: 2,
          text: 'It\'s definitely doable, but the professional range requires a 240-volt dedicated line and a much more robust ventilation system.',
          timestamp: 28.6,
          speaker: 'Mike Johnson',
          highlightedText: 'It\'s definitely doable, but the professional range requires a 240-volt dedicated line and a much more robust ventilation system.',
        },
      ],
    },
    relevanceScore: 0.87,
  },
];
