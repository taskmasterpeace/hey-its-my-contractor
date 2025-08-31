// Demo data for Image Search and AI Integration system

import { GoogleImageResult } from './ImageSearchInterface';
import { LibraryImage, ImageFolder } from './ImageLibrary';
import { WatermarkSettings } from './CompanyWatermark';

// Realistic contractor search queries
export const CONTRACTOR_SEARCH_HISTORY = [
  'white shaker kitchen cabinets hardware',
  'subway tile backsplash white grout',
  'granite countertops dark colors',
  'hardwood flooring oak natural',
  'pendant lights kitchen island modern',
  'bathroom vanity double sink 60 inch',
  'exterior trim black window door',
  'quartz countertops calacatta marble look',
  'stainless steel appliances package',
  'tile shower surround subway',
  'crown molding white painted',
  'barn door hardware black sliding',
  'recessed lighting LED 6 inch',
  'faucet kitchen single handle brushed nickel',
  'cabinet handles brushed gold modern'
];

// Mock Google Images search results with contractor-relevant content
export function generateMockSearchResults(query: string, count: number = 24): GoogleImageResult[] {
  const baseCategories = {
    'kitchen': {
      titles: [
        'Modern White Shaker Kitchen Cabinets',
        'Granite Countertops Dark Galaxy',
        'Subway Tile Backsplash Installation',
        'Kitchen Island with Pendant Lighting',
        'Stainless Steel Appliance Package',
        'Under Cabinet LED Strip Lighting'
      ],
      domains: ['homedepot.com', 'lowes.com', 'cabinetsdirect.com', 'granitecountertops.com']
    },
    'bathroom': {
      titles: [
        '60 Inch Double Sink Vanity White',
        'Subway Tile Shower Surround',
        'Brushed Nickel Faucet Single Handle',
        'Recessed Medicine Cabinet Mirror',
        'Porcelain Floor Tile 12x24',
        'Exhaust Fan with LED Light'
      ],
      domains: ['homedepot.com', 'lowes.com', 'bathroomvanities.com', 'tileshop.com']
    },
    'flooring': {
      titles: [
        'Oak Hardwood Flooring Natural',
        'Luxury Vinyl Plank Waterproof',
        'Ceramic Tile 18x18 Neutral',
        'Laminate Flooring Wood Look',
        'Area Rug Traditional Pattern',
        'Baseboards White Painted MDF'
      ],
      domains: ['homedepot.com', 'lowes.com', 'lumberliquidators.com', 'flooranddecor.com']
    },
    'exterior': {
      titles: [
        'Black Window Trim Exterior',
        'Composite Decking Gray Boards',
        'Fiber Cement Siding White',
        'Asphalt Shingle Roofing Dark',
        'Front Door Entry Black Steel',
        'Exterior Light Fixtures Modern'
      ],
      domains: ['homedepot.com', 'lowes.com', 'buildingproducts.com', 'exteriorlighting.com']
    }
  };

  // Determine category from query
  let category = 'kitchen'; // default
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('bathroom') || lowerQuery.includes('vanity') || lowerQuery.includes('shower')) {
    category = 'bathroom';
  } else if (lowerQuery.includes('floor') || lowerQuery.includes('tile') || lowerQuery.includes('carpet')) {
    category = 'flooring';
  } else if (lowerQuery.includes('exterior') || lowerQuery.includes('window') || lowerQuery.includes('door') || lowerQuery.includes('siding')) {
    category = 'exterior';
  }

  const categoryData = baseCategories[category as keyof typeof baseCategories];
  
  return Array.from({ length: count }, (_, i) => {
    const titleIndex = i % categoryData.titles.length;
    const domainIndex = i % categoryData.domains.length;
    const width = 800 + (i % 3) * 200; // 800, 1000, 1200
    const height = 600 + (i % 3) * 150; // 600, 750, 900
    
    return {
      id: `result-${Date.now()}-${i}`,
      url: `https://picsum.photos/${width}/${height}?random=${Date.now() + i}`,
      thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now() + i}`,
      title: categoryData.titles[titleIndex],
      description: `Professional quality ${categoryData.titles[titleIndex].toLowerCase()} - perfect for contractor presentations`,
      source: categoryData.domains[domainIndex],
      domain: categoryData.domains[domainIndex],
      width,
      height,
      size: `${180 + Math.floor(Math.random() * 400)} KB`,
      format: i % 4 === 0 ? 'png' : 'jpg'
    };
  });
}

// Sample library images for contractors
export const DEMO_LIBRARY_IMAGES: LibraryImage[] = [
  {
    id: 'lib-1',
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    title: 'Modern White Kitchen with Island',
    description: 'Beautiful modern kitchen with large island, quartz countertops, and stainless appliances',
    tags: ['kitchen', 'modern', 'white', 'island', 'quartz', 'inspiration'],
    source: 'search',
    domain: 'homedepot.com',
    width: 1200,
    height: 800,
    size: '345 KB',
    format: 'jpg',
    savedAt: '2024-01-15T10:30:00Z',
    projectId: 'project-1',
    projectName: 'Johnson Kitchen Remodel',
    folder: 'inspiration',
    isFavorite: true,
    usage: 'inspiration'
  },
  {
    id: 'lib-2',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    title: 'Subway Tile Backsplash Detail',
    description: 'Classic white subway tile with dark grout - perfect for traditional kitchens',
    tags: ['tile', 'backsplash', 'subway', 'white', 'traditional', 'materials'],
    source: 'search',
    domain: 'tileshop.com',
    width: 800,
    height: 600,
    size: '234 KB',
    format: 'jpg',
    savedAt: '2024-01-14T15:45:00Z',
    projectId: 'project-1',
    projectName: 'Johnson Kitchen Remodel',
    folder: 'materials',
    isFavorite: false,
    usage: 'materials'
  },
  {
    id: 'lib-3',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
    title: 'Bathroom Vanity Double Sink',
    description: 'Elegant 72-inch double vanity with quartz top and modern fixtures',
    tags: ['bathroom', 'vanity', 'double-sink', 'modern', 'quartz', 'reference'],
    source: 'search',
    domain: 'bathroomvanities.com',
    width: 1000,
    height: 750,
    size: '412 KB',
    format: 'jpg',
    savedAt: '2024-01-13T09:20:00Z',
    projectId: 'project-2',
    projectName: 'Smith Master Bath',
    folder: 'reference',
    isFavorite: true,
    usage: 'reference'
  },
  {
    id: 'lib-4',
    url: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=400',
    title: 'Hardwood Flooring Installation',
    description: 'Premium oak hardwood flooring with natural finish',
    tags: ['flooring', 'hardwood', 'oak', 'natural', 'installation', 'materials'],
    source: 'upload',
    domain: 'field-photo',
    width: 800,
    height: 600,
    size: '287 KB',
    format: 'jpg',
    savedAt: '2024-01-12T14:15:00Z',
    projectId: 'project-3',
    projectName: 'Wilson Living Room',
    folder: 'before-after',
    isFavorite: false,
    usage: 'before_after'
  },
  {
    id: 'lib-5',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
    title: 'AI Enhanced Kitchen Mockup',
    description: 'AI-generated visualization showing proposed cabinet and countertop updates',
    tags: ['ai-generated', 'kitchen', 'mockup', 'visualization', 'cabinets', 'enhanced'],
    source: 'ai',
    domain: 'nano-banana.ai',
    width: 1024,
    height: 768,
    size: '398 KB',
    format: 'jpg',
    savedAt: '2024-01-11T16:45:00Z',
    projectId: 'project-1',
    projectName: 'Johnson Kitchen Remodel',
    folder: 'inspiration',
    isFavorite: true,
    usage: 'other'
  },
  {
    id: 'lib-6',
    url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    title: 'Exterior Black Window Trim',
    description: 'Modern black exterior window trim detail - excellent contrast with white siding',
    tags: ['exterior', 'trim', 'window', 'black', 'modern', 'contrast', 'reference'],
    source: 'search',
    domain: 'buildingproducts.com',
    width: 800,
    height: 1200,
    size: '445 KB',
    format: 'jpg',
    savedAt: '2024-01-10T11:30:00Z',
    projectId: 'project-4',
    projectName: 'Anderson Exterior Update',
    folder: 'reference',
    isFavorite: false,
    usage: 'reference'
  }
];

// Image folders for organization
export const DEMO_FOLDERS: ImageFolder[] = [
  {
    id: 'inspiration',
    name: 'Design Inspiration',
    description: 'Ideas and inspiration for client presentations',
    imageCount: 15,
    createdAt: '2024-01-01T00:00:00Z',
    color: '#FFD700'
  },
  {
    id: 'materials',
    name: 'Materials & Products',
    description: 'Product catalogs and material samples',
    imageCount: 23,
    createdAt: '2024-01-02T00:00:00Z',
    color: '#32CD32'
  },
  {
    id: 'reference',
    name: 'Reference Images',
    description: 'Technical references and installation examples',
    imageCount: 18,
    createdAt: '2024-01-03T00:00:00Z',
    color: '#4169E1'
  },
  {
    id: 'before-after',
    name: 'Before & After',
    description: 'Project transformation documentation',
    imageCount: 12,
    createdAt: '2024-01-04T00:00:00Z',
    color: '#9370DB'
  },
  {
    id: 'client-presentations',
    name: 'Client Presentations',
    description: 'Curated images for client meetings',
    imageCount: 8,
    createdAt: '2024-01-05T00:00:00Z',
    color: '#FF6347'
  }
];

// Default watermark settings for contractors
export const DEFAULT_CONTRACTOR_WATERMARK: WatermarkSettings = {
  enabled: true,
  companyName: 'Premium Contractors LLC',
  position: 'bottom-right',
  size: 'medium',
  opacity: 75,
  style: 'filled',
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  fontSize: 13,
  fontFamily: 'sans-serif',
  rotation: 0,
  margin: 16,
  showOnAllImages: false,
  showOnAIImages: true,
  brandColors: ['#1F2937', '#3B82F6', '#10B981', '#F59E0B']
};

// Company information examples
export const DEMO_COMPANY_INFO = {
  name: 'Premium Contractors LLC',
  logo: '/images/company-logo.png',
  brandColors: ['#1F2937', '#3B82F6', '#10B981', '#F59E0B'],
  website: 'https://premiumcontractors.com',
  phone: '(555) 123-4567'
};

// Sample contractor search categories with descriptions
export const CONTRACTOR_SEARCH_CATEGORIES = [
  {
    name: 'Kitchen',
    query: 'kitchen cabinets countertops appliances backsplash',
    icon: '🍳',
    description: 'Cabinets, countertops, appliances, backsplashes',
    popular: true
  },
  {
    name: 'Bathroom',
    query: 'bathroom vanity shower tile fixtures faucets',
    icon: '🛁',
    description: 'Vanities, showers, tile, fixtures, faucets',
    popular: true
  },
  {
    name: 'Flooring',
    query: 'flooring hardwood tile laminate carpet vinyl',
    icon: '🏠',
    description: 'Hardwood, tile, laminate, carpet, vinyl',
    popular: true
  },
  {
    name: 'Exterior',
    query: 'exterior siding roofing windows doors trim',
    icon: '🏘️',
    description: 'Siding, roofing, windows, doors, trim',
    popular: true
  },
  {
    name: 'Lighting',
    query: 'lighting fixtures LED recessed pendant chandeliers',
    icon: '💡',
    description: 'Fixtures, LED, recessed, pendant, chandeliers',
    popular: false
  },
  {
    name: 'Paint & Color',
    query: 'paint colors interior exterior primer stain',
    icon: '🎨',
    description: 'Paint colors, primers, stains, finishes',
    popular: false
  },
  {
    name: 'Hardware',
    query: 'hardware cabinet handles hinges locks pulls',
    icon: '🔧',
    description: 'Cabinet hardware, hinges, locks, pulls',
    popular: false
  },
  {
    name: 'Appliances',
    query: 'appliances refrigerator stove dishwasher microwave',
    icon: '📱',
    description: 'Kitchen and laundry appliances',
    popular: false
  }
];

// AI prompt templates for contractors
export const CONTRACTOR_AI_PROMPTS = [
  {
    category: 'Renovation Visualization',
    prompts: [
      'Show this room with updated fixtures and finishes',
      'Apply this color scheme throughout the space',
      'Visualize this kitchen with new cabinets and countertops',
      'Transform this bathroom with modern fixtures',
      'Update this exterior with new siding and trim'
    ]
  },
  {
    category: 'Before/After Mockups',
    prompts: [
      'Create a professional before and after comparison',
      'Show the potential transformation of this space',
      'Generate a renovation preview for client presentation',
      'Demonstrate the impact of these proposed changes',
      'Create a realistic renovation mockup'
    ]
  },
  {
    category: 'Material Application',
    prompts: [
      'Apply this flooring throughout the entire space',
      'Replace all countertops with this material',
      'Add this trim style to all windows and doors',
      'Update all cabinet hardware to this style',
      'Apply this paint color to the walls'
    ]
  },
  {
    category: 'Style Matching',
    prompts: [
      'Match the style and finish of this reference',
      'Apply this design aesthetic throughout',
      'Coordinate all elements with this color palette',
      'Create consistency with this material selection',
      'Harmonize the space with this design approach'
    ]
  }
];

// Integration settings for FieldTime
export const FIELDTIME_INTEGRATION_CONFIG = {
  syncToProjects: true,
  syncToDocuments: true,
  autoTagWithProject: true,
  createTimelineEntries: true,
  notifyTeamMembers: false,
  includeMeetingContext: true,
  preserveOriginalSource: true,
  watermarkFieldTimeImages: true
};

export default {
  CONTRACTOR_SEARCH_HISTORY,
  generateMockSearchResults,
  DEMO_LIBRARY_IMAGES,
  DEMO_FOLDERS,
  DEFAULT_CONTRACTOR_WATERMARK,
  DEMO_COMPANY_INFO,
  CONTRACTOR_SEARCH_CATEGORIES,
  CONTRACTOR_AI_PROMPTS,
  FIELDTIME_INTEGRATION_CONFIG
};