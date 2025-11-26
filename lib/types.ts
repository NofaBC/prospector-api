cat > lib/types.ts << 'EOF'
export type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  createdAt: Date;
  completedAt?: Date;
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
EOF
