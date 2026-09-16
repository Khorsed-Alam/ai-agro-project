import type { Field } from '../types';
import { SAMPLE_FIELDS } from '../data/sampleFields';

const API_BASE_URL = '/api';

export interface HealthResponse {
  status: string;
  project: string;
}

export const apiService = {
  /**
   * Check FastAPI backend connection status
   */
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend server not reachable, using offline status fallback:', error);
      return {
        status: 'offline_fallback',
        project: 'AgroAI'
      };
    }
  },

  /**
   * Get fields data from FastAPI or fallback to sample dataset
   */
  async getFields(): Promise<Field[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/fields`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable, returning demo fields dataset:', error);
      return SAMPLE_FIELDS;
    }
  },

  /**
   * Generic trigger call for AI module status foundation endpoints
   */
  async runAlgorithmPlaceholder(algorithmId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/${algorithmId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      return {
        status: 'foundation_ready',
        message: `${algorithmId} foundation ready. Full execution coming in Week 2.`,
        error: String(error)
      };
    }
  }
};
