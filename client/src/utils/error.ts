import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ msg?: string }>;
}

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) {
      return data.message;
    }
    const firstError = data?.errors?.[0]?.msg;
    if (firstError) {
      return firstError;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка. Попробуйте еще раз.';
};
