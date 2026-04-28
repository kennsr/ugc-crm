export const VIDEO_STATUSES = [
  'Backlog',
  'Shooting',
  'Editing',
  'In Review',
  'Revision',
  'Link Required',
  'Posted',
  'Not Accepted',
  'Cancelled',
] as const;

export const CAMPAIGN_STATUSES = ['Active', 'Paused', 'Completed', 'Archived'] as const;

export function statusKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '_');
}

export function statusLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function videoBadgeClass(status: string): string {
  switch (status) {
    case 'posted': return 'badge-success';
    case 'link_required': return 'badge-warning';
    case 'revision': return 'badge-danger';
    case 'not_accepted': return 'badge-gray';
    case 'shooting':
    case 'editing': return 'badge-orange';
    case 'in_review': return 'badge-warning';
    case 'cancelled': return 'badge-neutral';
    case 'backlog': return 'badge-neutral';
    default: return 'badge-neutral';
  }
}

export function campaignBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active': return 'badge-success';
    case 'paused': return 'badge-warning';
    case 'completed':
    case 'archived': return 'badge-neutral';
    default: return 'badge-neutral';
  }
}
