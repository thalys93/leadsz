import { pricesAreOrdered } from './service-price';

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(`service-price self-check failed: ${label}`);
  }
}

assert(pricesAreOrdered(null, null, null), 'tudo null ok');
assert(pricesAreOrdered(100, null, 300), 'parcial ok');
assert(pricesAreOrdered(100, 200, 300), 'ordem válida');
assert(pricesAreOrdered(100, 100, 100), 'iguais ok');
assert(!pricesAreOrdered(200, 100, 300), 'ideal abaixo do min');
assert(!pricesAreOrdered(100, 300, 200), 'ideal acima do max');

console.log('service-price self-check ok');
