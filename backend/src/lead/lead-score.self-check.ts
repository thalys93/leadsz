import { CheckpointKey } from 'src/enums/CheckpointKey';
import { computeLeadScore, computeLeadTemperature } from './lead-score';

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(`lead-score self-check failed: ${label}`);
  }
}

assert(computeLeadScore({}) === 0, 'sem checkpoints');
assert(
  computeLeadScore({ [CheckpointKey.DEMONSTROU_INTERESSE]: true }) === 15,
  'um checkpoint',
);
assert(
  computeLeadScore({
    [CheckpointKey.DEMONSTROU_INTERESSE]: true,
    [CheckpointKey.PEDIU_PROPOSTA]: true,
    [CheckpointKey.AGENDOU_REUNIAO]: true,
    [CheckpointKey.ORCAMENTO_ALINHADO]: true,
    [CheckpointKey.DECISOR_ENVOLVIDO]: true,
    [CheckpointKey.URGENCIA_PRAZO]: true,
  }) === 100,
  'todos os checkpoints somam 100',
);
assert(
  computeLeadScore({
    [CheckpointKey.PEDIU_PROPOSTA]: true,
    [CheckpointKey.DEMONSTROU_INTERESSE]: false,
  }) === 20,
  'checkpoint desmarcado não soma',
);

assert(computeLeadTemperature(0) === 'FRIO', 'score 0 é frio');
assert(computeLeadTemperature(39) === 'FRIO', 'score 39 é frio');
assert(computeLeadTemperature(40) === 'MORNO', 'score 40 é morno');
assert(computeLeadTemperature(69) === 'MORNO', 'score 69 é morno');
assert(computeLeadTemperature(70) === 'QUENTE', 'score 70 é quente');
assert(computeLeadTemperature(100) === 'QUENTE', 'score 100 é quente');

console.log('lead-score self-check ok');
