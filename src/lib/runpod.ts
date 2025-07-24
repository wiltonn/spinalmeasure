import { nanoid } from 'nanoid';

export interface RunpodConfig {
  apiKey: string;
  endpointId: string;
  baseUrl?: string;
}

export interface RunpodJob {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';
  input?: any;
  output?: any;
  error?: string;
  executionTime?: number;
  delayTime?: number;
  retryCount?: number;
}

export interface ScoliosisInput {
  image_url: string;
  image_format: 'jpeg' | 'png' | 'dicom';
  confidence_threshold?: number;
  return_visualization?: boolean;
}

export interface ScoliosisOutput {
  primary_angle: number;
  secondary_angle?: number;
  primary_confidence: number;
  secondary_confidence?: number;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  vertebrae_detected: Array<{
    vertebra: string;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
  }>;
  measurement_lines: Array<{
    type: 'primary' | 'secondary';
    line_points: Array<{ x: number; y: number }>;
    angle: number;
  }>;
  visualization_url?: string;
  processing_time: number;
  model_version: string;
}

export class RunpodClient {
  private config: RunpodConfig;

  constructor(config: RunpodConfig) {
    this.config = {
      baseUrl: 'https://api.runpod.ai/v2',
      ...config,
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.config.baseUrl}/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Runpod API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async submitJob(input: ScoliosisInput): Promise<{ id: string }> {
    const jobId = nanoid();
    
    const response = await this.makeRequest(`${this.config.endpointId}/run`, {
      method: 'POST',
      body: JSON.stringify({
        input: {
          ...input,
          job_id: jobId,
        },
        webhook: process.env.NEXT_PUBLIC_APP_URL 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/runpod`
          : undefined,
      }),
    });

    return { id: response.id || jobId };
  }

  async getJobStatus(jobId: string): Promise<RunpodJob> {
    const response = await this.makeRequest(`${this.config.endpointId}/status/${jobId}`);
    return response;
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.makeRequest(`${this.config.endpointId}/cancel/${jobId}`, {
      method: 'POST',
    });
  }

  async processImage(input: ScoliosisInput): Promise<ScoliosisOutput> {
    // Submit job
    const { id: jobId } = await this.submitJob(input);

    // Poll for completion
    let maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const job = await this.getJobStatus(jobId);

      if (job.status === 'COMPLETED') {
        return job.output as ScoliosisOutput;
      }

      if (job.status === 'FAILED') {
        throw new Error(`Job failed: ${job.error || 'Unknown error'}`);
      }

      if (['CANCELLED', 'TIMED_OUT'].includes(job.status)) {
        throw new Error(`Job ${job.status.toLowerCase()}`);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Job timed out waiting for completion');
  }
}

// Singleton instance
let runpodClient: RunpodClient | null = null;

export function getRunpodClient(): RunpodClient {
  if (!runpodClient) {
    const apiKey = process.env.RUNPOD_API_KEY;
    const endpointId = process.env.RUNPOD_ENDPOINT_ID;

    if (!apiKey || !endpointId) {
      throw new Error('Missing Runpod configuration: RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID are required');
    }

    runpodClient = new RunpodClient({
      apiKey,
      endpointId,
    });
  }

  return runpodClient;
}

// Helper functions for severity classification
export function classifySeverity(primaryAngle: number, secondaryAngle?: number): 'normal' | 'mild' | 'moderate' | 'severe' {
  const maxAngle = Math.max(primaryAngle, secondaryAngle || 0);

  if (maxAngle < 10) return 'normal';
  if (maxAngle < 25) return 'mild';
  if (maxAngle < 45) return 'moderate';
  return 'severe';
}

export function shouldReviewMeasurement(primaryConfidence: number, secondaryConfidence?: number): boolean {
  const minConfidence = Math.min(primaryConfidence, secondaryConfidence || 100);
  return minConfidence < 80;
}