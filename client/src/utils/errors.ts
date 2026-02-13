export const isNetworkError = (error: Error | unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('fetch') || message.includes('network') || message.includes('failed to fetch');
  }
  return false;
};

export const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) {
      return `${response.status}: ${response.statusText}`;
    }
    
    try {
      const error = JSON.parse(text);
      return error.message || `${response.status}: ${response.statusText}`;
    } catch {
      return text;
    }
  } catch {
    return `${response.status}: ${response.statusText}`;
  }
};


