// Demo data for realistic contractor meetings
import { 
  Meeting, 
  Transcript, 
  TranscriptSegment, 
  UserProfile, 
  Project, 
  MeetingTag,
  EnhancedMeetingData,
  MeetingSearchResult 
} from '@contractor-platform/types';

// Sample Users/Participants
export const sampleParticipants: UserProfile[] = [
  {
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike@fieldtimeconstruction.com',
    phone: '(555) 123-4567',
    avatar_url: undefined,
    company: 'FieldTime Construction',
    license_number: 'C-42-987654',
  },
  {
    first_name: 'Sarah',
    last_name: 'Williams',
    email: 'sarah@fieldtimeconstruction.com',
    phone: '(555) 123-4568',
    avatar_url: undefined,
    company: 'FieldTime Construction',
    license_number: 'C-42-987655',
  },
  {
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 987-6543',
    avatar_url: undefined,
    company: undefined,
    license_number: undefined,
  },
  {
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@email.com',
    phone: '(555) 987-6544',
    avatar_url: undefined,
    company: undefined,
    license_number: undefined,
  },
  {
    first_name: 'Tom',
    last_name: 'Rodriguez',
    email: 'tom@acmeelectric.com',
    phone: '(555) 456-7890',
    avatar_url: undefined,
    company: 'ACME Electric',
    license_number: 'C-10-123456',
  },
  {
    first_name: 'Lisa',
    last_name: 'Chen',
    email: 'lisa@chenplumbing.com',
    phone: '(555) 789-0123',
    avatar_url: undefined,
    company: 'Chen Plumbing Services',
    license_number: 'C-36-654321',
  },
  {
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@cityinspections.gov',
    phone: '(555) 111-2222',
    avatar_url: undefined,
    company: 'City Building Department',
    license_number: undefined,
  },
];

// Sample Projects
export const sampleProjects: Project[] = [
  {
    id: 'proj-1',
    tenant_id: 'tenant-1',
    name: 'Johnson Kitchen Remodel',
    address: '1234 Oak Street, San Francisco, CA 94102',
    status: 'active',
    client_user_id: 'user-3',
    budget: 45000,
    start_date: '2025-01-15T00:00:00Z',
    end_date: '2025-03-15T00:00:00Z',
    progress_percentage: 65,
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-01-28T14:30:00Z',
  },
  {
    id: 'proj-2',
    tenant_id: 'tenant-1',
    name: 'Davis Master Bathroom',
    address: '5678 Pine Avenue, San Francisco, CA 94115',
    status: 'active',
    client_user_id: 'user-4',
    budget: 28000,
    start_date: '2025-01-20T00:00:00Z',
    end_date: '2025-02-28T00:00:00Z',
    progress_percentage: 40,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-28T16:45:00Z',
  },
  {
    id: 'proj-3',
    tenant_id: 'tenant-1',
    name: 'Rodriguez Deck Addition',
    address: '9012 Maple Drive, Oakland, CA 94610',
    status: 'planning',
    client_user_id: 'user-5',
    budget: 15000,
    start_date: '2025-02-10T00:00:00Z',
    end_date: '2025-03-30T00:00:00Z',
    progress_percentage: 5,
    created_at: '2025-01-25T10:30:00Z',
    updated_at: '2025-01-28T11:15:00Z',
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

// Sample Detailed Transcripts
export const sampleTranscripts: Record<string, Transcript> = {
  'meeting-1': {
    id: 'transcript-1',
    meeting_id: 'meeting-1',
    provider: 'assemblyai',
    language: 'en',
    text: 'Kitchen Remodel Progress Review - Week 4. Discussion of electrical work completion, cabinet delivery timeline, and upcoming plumbing inspection. Action items include scheduling final electrical inspection and coordinating cabinet installation with client schedule.',
    segments: [
      {
        start_time: 0,
        end_time: 8.5,
        speaker: 'Mike Johnson',
        text: 'Good morning, John. Thanks for meeting with me today to discuss the kitchen remodel progress. We\'ve made significant headway in week 4.',
        confidence: 0.95,
      },
      {
        start_time: 8.5,
        end_time: 16.2,
        speaker: 'John Smith',
        text: 'Good morning, Mike. I\'m excited to hear about the progress. The family is really looking forward to having their kitchen back.',
        confidence: 0.92,
      },
      {
        start_time: 16.2,
        end_time: 28.7,
        speaker: 'Mike Johnson', 
        text: 'Great news on that front. We\'ve completed the electrical rough-in work. Tom and his team did an excellent job running the new circuits for the island and under-cabinet lighting.',
        confidence: 0.94,
      },
      {
        start_time: 28.7,
        end_time: 42.1,
        speaker: 'Tom Rodriguez',
        text: 'Thanks, Mike. We installed dedicated 20-amp circuits for the island outlets and a separate circuit for the pendant lighting. Everything\'s up to code and ready for inspection.',
        confidence: 0.93,
      },
      {
        start_time: 42.1,
        end_time: 55.3,
        speaker: 'John Smith',
        text: 'That\'s fantastic. When can we schedule the electrical inspection? I want to make sure we stay on track.',
        confidence: 0.91,
      },
      {
        start_time: 55.3,
        end_time: 72.8,
        speaker: 'Mike Johnson',
        text: 'I\'ll call the city inspector tomorrow morning. We should be able to get an inspection scheduled for Friday. Once that passes, we can start the drywall work.',
        confidence: 0.96,
      },
      {
        start_time: 72.8,
        end_time: 87.4,
        speaker: 'Mike Johnson',
        text: 'Now, about the cabinets. I have some good news and some scheduling considerations. The manufacturer confirmed they can deliver next week, but we need to coordinate the timing.',
        confidence: 0.94,
      },
      {
        start_time: 87.4,
        end_time: 102.6,
        speaker: 'John Smith',
        text: 'What kind of coordination are we talking about? My wife will be working from home most of next week.',
        confidence: 0.92,
      },
      {
        start_time: 102.6,
        end_time: 118.9,
        speaker: 'Mike Johnson',
        text: 'The delivery truck is quite large, so we\'ll need clear access to your driveway from about 8 AM to noon on Wednesday. Can we make that work?',
        confidence: 0.95,
      },
      {
        start_time: 118.9,
        end_time: 132.2,
        speaker: 'John Smith',
        text: 'Wednesday works perfectly. I can move my car to the street that morning. How long will the actual installation take?',
        confidence: 0.93,
      },
      {
        start_time: 132.2,
        end_time: 148.7,
        speaker: 'Mike Johnson',
        text: 'Cabinet installation typically takes 2-3 days. We\'ll start with the base cabinets, then the wall cabinets, and finally the crown molding and hardware.',
        confidence: 0.97,
      },
      {
        start_time: 148.7,
        end_time: 162.1,
        speaker: 'John Smith',
        text: 'Perfect. One question - will we be able to use the kitchen at all during installation?',
        confidence: 0.91,
      },
      {
        start_time: 162.1,
        end_time: 178.5,
        speaker: 'Mike Johnson',
        text: 'You\'ll have limited access. The sink will be disconnected during base cabinet installation, but we can have it functional by evening each day. I\'d recommend planning simple meals that week.',
        confidence: 0.94,
      },
    ],
    summary: 'Week 4 progress review for Johnson kitchen remodel. Electrical rough-in completed successfully by Tom Rodriguez and team. City inspection needed for Friday to stay on schedule. Cabinet delivery confirmed for next Wednesday morning - client needs to ensure driveway access 8 AM to noon. Installation will take 2-3 days with limited kitchen functionality during work.',
    action_items: [
      'Call city inspector tomorrow to schedule electrical inspection for Friday',
      'Confirm cabinet delivery for Wednesday 8 AM - noon',
      'Clear driveway access Wednesday morning',
      'Plan simple meals during cabinet installation week',
      'Schedule drywall work after electrical inspection passes',
    ],
    created_at: '2025-01-22T15:30:00Z',
  },

  'meeting-2': {
    id: 'transcript-2',
    meeting_id: 'meeting-2',
    provider: 'assemblyai',
    language: 'en',
    text: 'Davis Master Bathroom Initial Consultation. Discussed layout options, fixture selections, timeline, and budget considerations. Client preferences for walk-in shower, double vanity, and luxury finishes.',
    segments: [
      {
        start_time: 0,
        end_time: 12.3,
        speaker: 'Mike Johnson',
        text: 'Good afternoon, Emily. Thank you for choosing FieldTime Construction for your master bathroom renovation. I\'m excited to discuss your vision for this project.',
        confidence: 0.96,
      },
      {
        start_time: 12.3,
        end_time: 28.7,
        speaker: 'Emily Davis',
        text: 'Thank you for coming out, Mike. We\'ve been planning this renovation for months. The current bathroom is just too cramped, and we really want to create a spa-like retreat.',
        confidence: 0.93,
      },
      {
        start_time: 28.7,
        end_time: 45.2,
        speaker: 'Mike Johnson',
        text: 'I can definitely see the potential here. The space is larger than it appears. What are your must-haves for the new design?',
        confidence: 0.95,
      },
      {
        start_time: 45.2,
        end_time: 62.8,
        speaker: 'Emily Davis',
        text: 'We definitely want a walk-in shower - no more stepping over the tub edge. And a double vanity is essential since we both get ready at the same time in the mornings.',
        confidence: 0.92,
      },
      {
        start_time: 62.8,
        end_time: 78.4,
        speaker: 'Mike Johnson',
        text: 'Perfect. With the current layout, we can easily accommodate both. I\'m thinking we remove this wall here to open up the shower area. What do you think about a glass enclosure?',
        confidence: 0.94,
      },
      {
        start_time: 78.4,
        end_time: 95.1,
        speaker: 'Emily Davis',
        text: 'Glass would be beautiful. Will that work with our budget? We\'re hoping to stay around twenty-eight thousand dollars total.',
        confidence: 0.91,
      },
      {
        start_time: 95.1,
        end_time: 112.6,
        speaker: 'Mike Johnson',
        text: 'That\'s definitely workable. For fixtures, I\'d recommend mid-range options that still give you that luxury feel. We can achieve a high-end look without breaking the budget.',
        confidence: 0.96,
      },
      {
        start_time: 112.6,
        end_time: 128.9,
        speaker: 'Emily Davis',
        text: 'That sounds great. What about the timeline? We have guests coming for Easter, so we\'d love to have it done by then.',
        confidence: 0.93,
      },
      {
        start_time: 128.9,
        end_time: 145.3,
        speaker: 'Mike Johnson',
        text: 'Easter is March 30th, so that gives us about eight weeks. That\'s tight but doable. We\'d need to start within the next two weeks to meet that deadline.',
        confidence: 0.95,
      },
      {
        start_time: 145.3,
        end_time: 162.7,
        speaker: 'Emily Davis',
        text: 'What are the major steps? I want to understand what we\'re getting into.',
        confidence: 0.92,
      },
      {
        start_time: 162.7,
        end_time: 182.4,
        speaker: 'Mike Johnson',
        text: 'First, demolition and plumbing rough-in. Then electrical work, tile work, and finally fixture installation. The messiest part is the first week, then it gets more manageable.',
        confidence: 0.94,
      },
    ],
    summary: 'Initial consultation for Davis master bathroom renovation. Client wants spa-like retreat with walk-in shower and double vanity. Budget target of $28,000 is workable with mid-range fixtures. Timeline is tight for Easter deadline - need to start within two weeks. Major phases: demolition, plumbing, electrical, tile, fixtures.',
    action_items: [
      'Prepare detailed quote with fixture selections and timeline',
      'Schedule follow-up meeting to review plans and contract',
      'Research glass shower enclosure options within budget',
      'Coordinate with plumbing subcontractor for rough-in quote',
      'Provide Easter timeline with key milestones',
    ],
    created_at: '2025-01-15T16:45:00Z',
  },

  'meeting-3': {
    id: 'transcript-3',
    meeting_id: 'meeting-3',
    provider: 'assemblyai',
    language: 'en',
    text: 'Kitchen remodel change order discussion regarding upgraded appliance package and additional electrical work.',
    segments: [
      {
        start_time: 0,
        end_time: 11.2,
        speaker: 'Mike Johnson',
        text: 'Hi John, thanks for making time today. I wanted to discuss the appliance upgrade you mentioned and what that means for the electrical work.',
        confidence: 0.95,
      },
      {
        start_time: 11.2,
        end_time: 28.6,
        speaker: 'John Smith',
        text: 'Right, my wife fell in love with that professional-grade range we saw at the showroom. I know it\'s a change from our original plan, but is it feasible?',
        confidence: 0.92,
      },
      {
        start_time: 28.6,
        end_time: 45.8,
        speaker: 'Mike Johnson',
        text: 'It\'s definitely doable, but the professional range requires a 240-volt dedicated line and a much more robust ventilation system. Let me break down the additional costs.',
        confidence: 0.94,
      },
      {
        start_time: 45.8,
        end_time: 62.1,
        speaker: 'Tom Rodriguez',
        text: 'For the electrical, we\'re looking at running a new 50-amp circuit from the panel. Plus, we\'ll need to upgrade the hood ventilation to handle the higher BTU output.',
        confidence: 0.93,
      },
      {
        start_time: 62.1,
        end_time: 78.4,
        speaker: 'John Smith',
        text: 'What kind of additional investment are we talking about? I want to be upfront with my wife about the total cost.',
        confidence: 0.91,
      },
      {
        start_time: 78.4,
        end_time: 96.7,
        speaker: 'Mike Johnson',
        text: 'The electrical upgrade is about twelve hundred dollars, and the professional-grade ventilation system adds another eighteen hundred. So we\'re looking at roughly three thousand additional.',
        confidence: 0.96,
      },
      {
        start_time: 96.7,
        end_time: 112.3,
        speaker: 'John Smith',
        text: 'That\'s actually less than I expected. The range itself is the bigger expense. Will this affect our timeline at all?',
        confidence: 0.92,
      },
      {
        start_time: 112.3,
        end_time: 128.9,
        speaker: 'Mike Johnson',
        text: 'Minimal impact. We can do the electrical work during our currently scheduled electrical phase. The range delivery might take a few extra days to coordinate.',
        confidence: 0.94,
      },
    ],
    summary: 'Change order discussion for Johnson kitchen remodel. Client wants to upgrade to professional-grade range requiring 240V electrical and enhanced ventilation. Additional cost: $1,200 electrical + $1,800 ventilation = $3,000 total. Minimal timeline impact if approved promptly.',
    action_items: [
      'Prepare formal change order document with detailed costs',
      'Get client approval by end of week to maintain schedule',
      'Coordinate professional range delivery timeline',
      'Schedule enhanced ventilation installation',
    ],
    created_at: '2025-01-24T11:30:00Z',
  },
};

// Sample Meetings
export const sampleMeetings: Meeting[] = [
  {
    id: 'meeting-1',
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
    notes: 'Electrical rough-in completed. Need to schedule city inspection for Friday. Cabinet delivery confirmed for next Wednesday.',
    created_at: '2025-01-22T13:45:00Z',
    updated_at: '2025-01-22T15:30:00Z',
  },
  {
    id: 'meeting-2',
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
    notes: 'Client wants spa-like bathroom with walk-in shower and double vanity. $28k budget, Easter deadline.',
    created_at: '2025-01-15T14:45:00Z',
    updated_at: '2025-01-15T16:30:00Z',
  },
  {
    id: 'meeting-3',
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
    notes: 'Client wants professional-grade range. Requires electrical upgrade and enhanced ventilation. +$3k cost.',
    created_at: '2025-01-24T10:15:00Z',
    updated_at: '2025-01-24T11:30:00Z',
  },
  {
    id: 'meeting-4',
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
    notes: 'Reviewed rough-in plumbing layout. Client approved fixture locations. Ready for inspection.',
    created_at: '2025-01-28T08:45:00Z',
    updated_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'meeting-5',
    project_id: 'proj-3',
    title: 'Rodriguez Deck - Planning Meeting',
    starts_at: '2025-02-03T13:00:00Z',
    type: 'consultation',
    participants: ['user-1', 'user-2'], // Mike, Sarah
    consent_given: true,
    status: 'scheduled',
    tags: ['planning', 'permits', 'materials'],
    notes: 'Initial planning session for deck addition project.',
    created_at: '2025-01-30T16:00:00Z',
    updated_at: '2025-01-30T16:00:00Z',
  },
  {
    id: 'meeting-6',
    project_id: 'proj-1',
    title: 'Kitchen Final Inspection',
    starts_at: '2025-02-15T10:00:00Z',
    ends_at: '2025-02-15T11:00:00Z',
    type: 'inspection',
    participants: ['user-1', 'user-3', 'user-7'], // Mike, John, David Wilson
    consent_given: true,
    status: 'scheduled',
    tags: ['inspection', 'final', 'permits'],
    notes: 'Final city inspection scheduled. All work should be complete by this date.',
    created_at: '2025-01-25T14:00:00Z',
    updated_at: '2025-01-25T14:00:00Z',
  },
];

// Enhanced Meeting Data (combining all the above)
export const sampleEnhancedMeetings: EnhancedMeetingData[] = sampleMeetings.map(meeting => {
  const project = sampleProjects.find(p => p.id === meeting.project_id)!;
  const participants = meeting.participants.map(pid => {
    const userIndex = parseInt(pid.split('-')[1]) - 1;
    return sampleParticipants[userIndex];
  });
  const transcript = sampleTranscripts[meeting.id];
  
  return {
    meeting,
    project,
    participants,
    transcript,
    duration: meeting.ends_at ? 
      Math.floor((new Date(meeting.ends_at).getTime() - new Date(meeting.starts_at).getTime()) / (1000 * 60)) : 
      undefined,
    action_items_count: transcript?.action_items?.length || 0,
    completed_actions: transcript?.action_items ? Math.floor(transcript.action_items.length * 0.6) : 0,
  };
});

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

// Utility functions for demo data
export const getParticipantById = (userId: string): UserProfile | undefined => {
  const userIndex = parseInt(userId.split('-')[1]) - 1;
  return sampleParticipants[userIndex];
};

export const getProjectById = (projectId: string): Project | undefined => {
  return sampleProjects.find(p => p.id === projectId);
};

export const getMeetingById = (meetingId: string): Meeting | undefined => {
  return sampleMeetings.find(m => m.id === meetingId);
};

export const getTranscriptByMeetingId = (meetingId: string): Transcript | undefined => {
  return sampleTranscripts[meetingId];
};

export const getEnhancedMeetingById = (meetingId: string): EnhancedMeetingData | undefined => {
  return sampleEnhancedMeetings.find(em => em.meeting.id === meetingId);
};