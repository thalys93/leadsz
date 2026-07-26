import { toSlug } from './slug';

function assert(condition: boolean, label: string) {
  if (!condition) throw new Error(`slug self-check failed: ${label}`);
}

assert(toSlug('Doces') === 'doces', 'lowercase');
assert(toSlug('  DOCÊS ') === 'doces', 'trim + accent');
assert(toSlug('Salgados / Forno') === 'salgados-forno', 'symbols');
assert(toSlug('Doce') === 'doce', 'singular stays distinct');
assert(toSlug('Acme Corp') === 'acme-corp', 'company name');

console.log('slug self-check ok');
