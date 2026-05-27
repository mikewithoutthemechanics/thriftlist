import { ClothingItem } from './types';

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  defaultValue?: string;
}

export const AVAILABLE_VARIABLES: TemplateVariable[] = [
  { name: 'title', label: 'Title', type: 'text', defaultValue: '' },
  { name: 'description', label: 'Description', type: 'textarea', defaultValue: '' },
  { name: 'price', label: 'Price (R)', type: 'number', defaultValue: '0' },
  { name: 'category', label: 'Category', type: 'select', options: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Activewear', 'Swimwear', 'Formal Wear', 'Vintage'], defaultValue: '' },
  { name: 'size', label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'], defaultValue: '' },
  { name: 'brand', label: 'Brand', type: 'text', defaultValue: '' },
  { name: 'condition', label: 'Condition', type: 'select', options: ['new', 'like_new', 'good', 'fair', 'poor'], defaultValue: 'good' },
  { name: 'color', label: 'Color', type: 'text', defaultValue: '' },
  { name: 'platforms', label: 'Platforms', type: 'select', options: ['yaga', 'facebook_marketplace', 'gumtree', 'olx', 'junkmail'], defaultValue: '' },
];

/**
 * Parse template content and extract used variables
 */
export function parseTemplateVariables(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Replace template variables with actual values
 */
export function applyTemplate(
  content: string,
  values: Record<string, string | number>
): string {
  let result = content;
  
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * Generate item from template and values
 */
export function generateItemFromTemplate(
  template: Template,
  values: Record<string, string | number>
): Partial<ClothingItem> {
  const content = applyTemplate(template.content, values);
  
  // Try to parse the content as JSON if it's a structured template
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    // If not JSON, treat it as a simple template with key-value pairs
    const lines = content.split('\n');
    const item: Partial<ClothingItem> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      if (key && value) {
        const keyLower = key.toLowerCase().trim();
        switch (keyLower) {
          case 'title':
            item.title = value;
            break;
          case 'description':
            item.description = value;
            break;
          case 'price':
            item.price = parseFloat(value);
            break;
          case 'category':
            item.category = value;
            break;
          case 'size':
            item.size = value;
            break;
          case 'brand':
            item.brand = value;
            break;
          case 'condition':
            item.condition = value as any;
            break;
          case 'color':
            item.color = value;
            break;
          case 'platforms':
            item.platforms = value.split(',').map(p => p.trim());
            break;
        }
      }
    }
    
    return item;
  }
}

/**
 * Validate template variables
 */
export function validateTemplateValues(
  template: Template,
  values: Record<string, string | number>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredVariables = parseTemplateVariables(template.content);
  
  for (const variable of requiredVariables) {
    if (!values[variable]) {
      const varConfig = AVAILABLE_VARIABLES.find(v => v.name === variable);
      errors.push(`${varConfig?.label || variable} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a default template
 */
export function createDefaultTemplate(name: string): Template {
  const content = `{
  "title": "{{title}}",
  "description": "{{description}}",
  "price": {{price}},
  "category": "{{category}}",
  "size": "{{size}}",
  "brand": "{{brand}}",
  "condition": "{{condition}}",
  "color": "{{color}}",
  "platforms": ["{{platforms}}"]
}`;

  return {
    id: '',
    name,
    description: 'Default item template',
    content,
    variables: parseTemplateVariables(content),
    userId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
