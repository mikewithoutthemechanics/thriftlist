import { ClothingItem } from './types';

export interface PlatformDefaults {
  platformId: string;
  defaultCategories: Record<string, string>;
  defaultConditions: Record<string, string>;
  requiredFields: string[];
  optionalFields: string[];
  photoRequirements: {
    minPhotos: number;
    maxPhotos: number;
    preferredAspectRatio: string;
  };
  descriptionRequirements: {
    minLength: number;
    maxLength: number;
    requiredKeywords?: string[];
  };
}

export const PLATFORM_DEFAULTS: Record<string, PlatformDefaults> = {
  facebook_marketplace: {
    platformId: 'facebook_marketplace',
    defaultCategories: {
      'Tops': 'Clothing',
      'Bottoms': 'Clothing',
      'Dresses': 'Clothing',
      'Outerwear': 'Clothing',
      'Shoes': 'Shoes',
      'Accessories': 'Accessories',
      'Bags': 'Bags',
      'Jewelry': 'Jewelry',
    },
    defaultConditions: {
      'new': 'New',
      'like_new': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
    },
    requiredFields: ['title', 'price', 'category', 'condition'],
    optionalFields: ['brand', 'size', 'color', 'description'],
    photoRequirements: {
      minPhotos: 1,
      maxPhotos: 10,
      preferredAspectRatio: '1:1',
    },
    descriptionRequirements: {
      minLength: 10,
      maxLength: 5000,
    },
  },
  yaga: {
    platformId: 'yaga',
    defaultCategories: {
      'Tops': 'Tops',
      'Bottoms': 'Bottoms',
      'Dresses': 'Dresses',
      'Outerwear': 'Outerwear',
      'Shoes': 'Shoes',
      'Accessories': 'Accessories',
      'Bags': 'Bags',
      'Jewelry': 'Jewelry',
    },
    defaultConditions: {
      'new': 'New with tags',
      'like_new': 'Like new',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
    },
    requiredFields: ['title', 'price', 'category', 'condition', 'photos'],
    optionalFields: ['brand', 'size', 'color', 'description'],
    photoRequirements: {
      minPhotos: 1,
      maxPhotos: 8,
      preferredAspectRatio: '4:3',
    },
    descriptionRequirements: {
      minLength: 20,
      maxLength: 1000,
    },
  },
  gumtree: {
    platformId: 'gumtree',
    defaultCategories: {
      'Tops': 'Clothing',
      'Bottoms': 'Clothing',
      'Dresses': 'Clothing',
      'Outerwear': 'Clothing',
      'Shoes': 'Shoes',
      'Accessories': 'Accessories',
    },
    defaultConditions: {
      'new': 'New',
      'like_new': 'Used - Like New',
      'good': 'Used - Good',
      'fair': 'Used - Fair',
      'poor': 'Used - Poor',
    },
    requiredFields: ['title', 'price', 'category', 'description'],
    optionalFields: ['brand', 'size', 'condition', 'color', 'photos'],
    photoRequirements: {
      minPhotos: 0,
      maxPhotos: 12,
      preferredAspectRatio: '4:3',
    },
    descriptionRequirements: {
      minLength: 50,
      maxLength: 2000,
      requiredKeywords: ['condition', 'location'],
    },
  },
  olx: {
    platformId: 'olx',
    defaultCategories: {
      'Tops': 'Fashion',
      'Bottoms': 'Fashion',
      'Dresses': 'Fashion',
      'Outerwear': 'Fashion',
      'Shoes': 'Fashion',
      'Accessories': 'Fashion',
    },
    defaultConditions: {
      'new': 'New',
      'like_new': 'Used - Like New',
      'good': 'Used - Good',
      'fair': 'Used - Fair',
      'poor': 'Used - Poor',
    },
    requiredFields: ['title', 'price', 'category', 'description'],
    optionalFields: ['brand', 'size', 'condition', 'color', 'photos'],
    photoRequirements: {
      minPhotos: 0,
      maxPhotos: 8,
      preferredAspectRatio: '1:1',
    },
    descriptionRequirements: {
      minLength: 30,
      maxLength: 1500,
    },
  },
  junkmail: {
    platformId: 'junkmail',
    defaultCategories: {
      'Tops': 'Clothing',
      'Bottoms': 'Clothing',
      'Dresses': 'Clothing',
      'Outerwear': 'Clothing',
      'Shoes': 'Shoes',
      'Accessories': 'Accessories',
    },
    defaultConditions: {
      'new': 'New',
      'like_new': 'Used - Excellent',
      'good': 'Used - Good',
      'fair': 'Used - Fair',
      'poor': 'Used - Poor',
    },
    requiredFields: ['title', 'price', 'category', 'description'],
    optionalFields: ['brand', 'size', 'condition', 'color', 'photos'],
    photoRequirements: {
      minPhotos: 0,
      maxPhotos: 10,
      preferredAspectRatio: '4:3',
    },
    descriptionRequirements: {
      minLength: 20,
      maxLength: 1000,
    },
  },
};

/**
 * Get platform-specific defaults for a given platform
 */
export function getPlatformDefaults(platformId: string): PlatformDefaults | null {
  return PLATFORM_DEFAULTS[platformId] || null;
}

/**
 * Validate item against platform requirements
 */
export function validateForPlatform(
  item: Partial<ClothingItem>,
  platformId: string
): { valid: boolean; errors: string[] } {
  const defaults = getPlatformDefaults(platformId);
  if (!defaults) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  // Check required fields
  for (const field of defaults.requiredFields) {
    if (!item[field as keyof ClothingItem]) {
      errors.push(`${field} is required for ${platformId}`);
    }
  }

  // Check photo requirements
  if (item.photos) {
    if (item.photos.length < defaults.photoRequirements.minPhotos) {
      errors.push(`Minimum ${defaults.photoRequirements.minPhotos} photos required for ${platformId}`);
    }
    if (item.photos.length > defaults.photoRequirements.maxPhotos) {
      errors.push(`Maximum ${defaults.photoRequirements.maxPhotos} photos allowed for ${platformId}`);
    }
  }

  // Check description requirements
  if (item.description) {
    if (item.description.length < defaults.descriptionRequirements.minLength) {
      errors.push(`Description must be at least ${defaults.descriptionRequirements.minLength} characters for ${platformId}`);
    }
    if (item.description.length > defaults.descriptionRequirements.maxLength) {
      errors.push(`Description must not exceed ${defaults.descriptionRequirements.maxLength} characters for ${platformId}`);
    }
    if (defaults.descriptionRequirements.requiredKeywords) {
      for (const keyword of defaults.descriptionRequirements.requiredKeywords) {
        if (!item.description.toLowerCase().includes(keyword.toLowerCase())) {
          errors.push(`Description must include "${keyword}" for ${platformId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Map category to platform-specific category
 */
export function mapCategoryToPlatform(category: string, platformId: string): string {
  const defaults = getPlatformDefaults(platformId);
  if (!defaults) return category;
  return defaults.defaultCategories[category] || category;
}

/**
 * Map condition to platform-specific condition
 */
export function mapConditionToPlatform(condition: string, platformId: string): string {
  const defaults = getPlatformDefaults(platformId);
  if (!defaults) return condition;
  return defaults.defaultConditions[condition] || condition;
}

/**
 * Apply platform defaults to item
 */
export function applyPlatformDefaults(
  item: Partial<ClothingItem>,
  platformId: string
): Partial<ClothingItem> {
  const result = { ...item };

  if (item.category) {
    result.category = mapCategoryToPlatform(item.category, platformId);
  }

  if (item.condition) {
    const mappedCondition = mapConditionToPlatform(item.condition, platformId);
    // Map back to our condition types if the platform mapping changed it
    const conditionMap: Record<string, 'new' | 'like_new' | 'good' | 'fair' | 'poor'> = {
      'New': 'new',
      'Like New': 'like_new',
      'Good': 'good',
      'Fair': 'fair',
      'Poor': 'poor',
      'Used - Like New': 'like_new',
      'Used - Good': 'good',
      'Used - Fair': 'fair',
      'Used - Poor': 'poor',
      'Used - Excellent': 'like_new',
      'New with tags': 'new',
    };
    result.condition = (conditionMap[mappedCondition] || item.condition) as 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  }

  return result;
}
