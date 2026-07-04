// /lib/api-client.ts
// Utility for making HTTP requests to the new Express Backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      cache: options.cache || 'no-store', // Prevent aggressive Next.js caching
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Important for passing HttpOnly cookies between Next.js and Express
      credentials: 'include', 
    });

    const result = await res.json();
    return result;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    return { success: false, message: error.message || 'An unexpected error occurred' };
  }
}
