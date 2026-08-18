import axios from 'axios';

export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    
    const errors = [];
    for (const key in data) {
      if (Array.isArray(data[key])) {
        errors.push(`${key}: ${data[key].join(', ')}`);
      } else if (typeof data[key] === 'string') {
        errors.push(`${key}: ${data[key]}`);
      }
    }
    if (errors.length > 0) return errors.join('\n');
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
};

export const extractFieldErrors = (error: unknown): Record<string, string> => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    const fieldErrors: Record<string, string> = {};
    for (const key in data) {
      if (key === 'detail') continue;
      if (Array.isArray(data[key])) {
        fieldErrors[key] = data[key].join(', ');
      } else if (typeof data[key] === 'string') {
        fieldErrors[key] = data[key];
      }
    }
    return fieldErrors;
  }
  return {};
};

