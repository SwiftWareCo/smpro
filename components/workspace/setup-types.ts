export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  module: 'base' | 'social' | 'seo' | 'assets';
}

export interface SetupStatus {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}
