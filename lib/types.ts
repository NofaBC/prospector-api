export type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'canceled';

export interface Job {
  id: string;
  url?: string;
  seedUrl?: string;
  status: JobStatus;
  createdAt: Date | string;
  completedAt?: Date | string;
  area?: string;
  sheetUrl?: string;
  counts: {
    found: number;
    appended: number;
  };
  result?: any;
}

export interface JobCreateRequest {
  url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
