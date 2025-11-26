cat > lib/types.ts << 'EOF'
// Export all types to make this a proper module
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
