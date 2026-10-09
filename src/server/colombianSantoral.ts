import { getEditorialSaint, type ColombianSaint } from '../data/colombianSaints.js';

export async function fetchColombianSantoral(date: string): Promise<ColombianSaint> {
  return getEditorialSaint(date);
}
