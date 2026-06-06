import { describe, expect, it } from 'vitest';
import { itemSchema, updateItemSchema } from './validation';

describe('validation', () => {
  it('accepts a valid item', () => {
    const result = itemSchema.parse({
      title: 'Test item',
      description: 'A description',
      price: 100,
      category: 'Tops',
      size: 'M',
      condition: 'good',
      photos: ['https://example.com/a.jpg'],
      platforms: ['yaga'],
    });

    expect(result.title).toBe('Test item');
  });

  it('rejects missing required fields', () => {
    expect(() =>
      itemSchema.parse({
        description: 'A description',
        price: 100,
        category: 'Tops',
        size: 'M',
        condition: 'good',
        photos: ['https://example.com/a.jpg'],
        platforms: ['yaga'],
      })
    ).toThrow();
  });

  it('requires uuid for updateItemSchema.id', () => {
    expect(() => updateItemSchema.parse({ id: 'not-a-uuid' })).toThrow();
  });
});
