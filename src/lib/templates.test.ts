import { describe, expect, it } from 'vitest';
import { applyTemplate, createDefaultTemplate, parseTemplateVariables, validateTemplateValues } from './templates';

describe('templates', () => {
  it('extracts variables', () => {
    const vars = parseTemplateVariables('Hello {{title}} and {{price}}');
    expect(vars.sort()).toEqual(['price', 'title']);
  });

  it('applies variables', () => {
    const out = applyTemplate('Hi {{title}}', { title: 'World' });
    expect(out).toBe('Hi World');
  });

  it('validates required variables', () => {
    const t = createDefaultTemplate('Default');
    const result = validateTemplateValues(t, { title: 'A' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
