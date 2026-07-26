import { CHECKPOINT_POINTS, CheckpointKey } from 'src/enums/CheckpointKey';

export type LeadCheckpoints = Partial<Record<CheckpointKey, boolean>>;
export type LeadTemperature = 'FRIO' | 'MORNO' | 'QUENTE';

export function computeLeadScore(checkpoints: LeadCheckpoints): number {
  return Object.entries(checkpoints).reduce(
    (sum, [key, checked]) =>
      checked ? sum + CHECKPOINT_POINTS[key as CheckpointKey] : sum,
    0,
  );
}

export function computeLeadTemperature(score: number): LeadTemperature {
  if (score >= 70) return 'QUENTE';
  if (score >= 40) return 'MORNO';
  return 'FRIO';
}
