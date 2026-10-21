import axios from 'axios';

export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join(', ');
    }
    if (typeof data === 'object' && data !== null) {
      if (data.detail) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) {
          return data.detail
            .map((item: unknown) => (typeof item === 'string' ? item : JSON.stringify(item)))
            .join(', ');
        }
        if (typeof data.detail === 'object') {
          return JSON.stringify(data.detail);
        }
      }
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;

      const errors: string[] = [];
      for (const key in data) {
        const val = (data as Record<string, unknown>)[key];
        if (Array.isArray(val)) {
          errors.push(`${key}: ${val.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ')}`);
        } else if (typeof val === 'string') {
          errors.push(`${key}: ${val}`);
        } else if (val && typeof val === 'object') {
          errors.push(`${key}: ${JSON.stringify(val)}`);
        }
      }
      if (errors.length > 0) return errors.join('\n');
    }
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
};

export const extractFieldErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const fieldErrors: Record<string, string> = {};
      for (const key in data) {
        if (key === 'detail') continue;
        const val = (data as Record<string, unknown>)[key];
        if (Array.isArray(val)) {
          fieldErrors[key] = val.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
        } else if (typeof val === 'string') {
          fieldErrors[key] = val;
        }
      }
      return fieldErrors;
    }
  }
  return {};
};

