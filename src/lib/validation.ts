import { z } from 'zod';

export const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Activewear', 'Swimwear', 'Formal Wear', 'Vintage'] as const;
export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;
export const PLATFORMS = ['facebook_marketplace', 'yaga', 'gumtree', 'olx', 'junkmail'] as const;

export const itemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  price: z.number().positive('Price must be greater than 0').max(100000, 'Price must be less than 100,000'),
  category: z.enum(CATEGORIES),
  size: z.string().min(1, 'Size is required').max(50, 'Size must be less than 50 characters'),
  brand: z.string().max(100, 'Brand must be less than 100 characters').optional(),
  condition: z.enum(CONDITIONS),
  color: z.string().max(50, 'Color must be less than 50 characters').optional(),
  photos: z.array(z.string().url('Photo must be a valid URL')).min(1, 'At least one photo is required').max(10, 'Maximum 10 photos allowed'),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'At least one platform is required'),
});

export const updateItemSchema = itemSchema.partial().extend({
  id: z.string().uuid('Invalid item ID'),
});

export const automationJobSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'At least one platform is required'),
});

export const settingsSchema = z.object({
  location: z.string().max(100).optional(),
  facebook_email: z.string().email('Invalid email').optional(),
  yaga_email: z.string().email('Invalid email').optional(),
  gumtree_email: z.string().email('Invalid email').optional(),
  olx_email: z.string().email('Invalid email').optional(),
  junkmail_email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  default_price: z.number().positive().optional(),
  yaga_api_key: z.string().max(200).optional(),
  facebook_access_token: z.string().max(500).optional(),
  gumtree_api_key: z.string().max(200).optional(),
  webhook_secret: z.string().max(200).optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description_template: z.string().min(1, 'Description template is required').max(5000, 'Template must be less than 5000 characters'),
  category: z.enum(CATEGORIES).optional(),
  platforms: z.array(z.enum(PLATFORMS)).default([]),
});

export const scheduledPostingSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'At least one platform is required'),
  scheduledAt: z.string().datetime('Invalid datetime format'),
});
