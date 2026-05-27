export interface ClothingItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  size: string;
  brand?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  color?: string;
  photos: string[];
  platforms: string[];
  status: 'draft' | 'ready' | 'posted' | 'sold';
  createdAt: string;
  updatedAt: string;
}

export interface Posting {
  id: string;
  itemId: string;
  platform: string;
  status: 'pending' | 'posted' | 'failed';
  url?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  id: string;
  name: string;
  url: string;
  hasApi: boolean;
  apiKey?: string;
  username?: string;
  password?: string;
  enabled: boolean;
}

export const SA_PLATFORMS: PlatformConfig[] = [
  {
    id: 'yaga',
    name: 'Yaga',
    url: 'https://yaga.co.za',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'facebook_marketplace',
    name: 'Facebook Marketplace',
    url: 'https://www.facebook.com/marketplace',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'gumtree',
    name: 'Gumtree South Africa',
    url: 'https://www.gumtree.co.za',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'olx',
    name: 'OLX South Africa',
    url: 'https://www.olx.co.za',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'junkmail',
    name: 'Junk Mail',
    url: 'https://www.junkmail.co.za',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'whatsapp_groups',
    name: 'WhatsApp Groups',
    url: 'https://web.whatsapp.com',
    hasApi: false,
    enabled: true,
  },
];

export const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Activewear',
  'Swimwear',
  'Formal Wear',
  'Vintage',
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];

export const CONDITIONS = [
  { value: 'new', label: 'New with tags' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good condition' },
  { value: 'fair', label: 'Fair condition' },
  { value: 'poor', label: 'Poor condition' },
];
