import { generateKeyBetween } from 'fractional-indexing';

import { Neighbors } from '@/features/tasks/utils/dnd/types';

export function generatePosition({ prev, next }: Neighbors) {
  return generateKeyBetween(prev, next);
}
