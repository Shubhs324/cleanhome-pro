export type Frequency = 'quotidienne' | 'hebdomadaire' | 'mensuelle' | 'saisonnière' | 'annuelle' | 'trimestrielle';

export interface Task {
  id: number;
  name: string;
  frequency: Frequency;
  zone: string;
  estimatedTime?: number;
}

export interface TaskInstance {
  taskId: number;
  scheduledDate: string;
  completed: boolean;
  completedAt?: string;
}
