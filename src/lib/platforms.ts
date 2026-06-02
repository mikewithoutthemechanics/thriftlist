import { PlatformConfig } from './types';

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
    url: 'https://www.facebook.com/marketplace/create',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'gumtree',
    name: 'Gumtree SA',
    url: 'https://www.gumtree.co.za/postad',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'olx',
    name: 'OLX SA',
    url: 'https://www.olx.co.za/post-ad',
    hasApi: false,
    enabled: true,
  },
  {
    id: 'junkmail',
    name: 'Junk Mail',
    url: 'https://www.junkmail.co.za/post-ad',
    hasApi: false,
    enabled: true,
  },
];

export function getPlatformById(id: string): PlatformConfig | undefined {
  return SA_PLATFORMS.find(p => p.id === id);
}
