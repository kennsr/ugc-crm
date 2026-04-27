// Pleasant palette for campaign colors — cycle through these.
export const CAMPAIGN_COLORS = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
] as const;

export function getCampaignColor(index: number): string {
  return CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length];
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}
