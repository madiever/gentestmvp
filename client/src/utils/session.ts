import { GeneratedTest, SubmitTestResponse } from '../types/test.types';

const CURRENT_TEST_KEY = 'gen-test:current-test';
const LAST_RESULT_KEY = 'gen-test:last-result';

export const saveCurrentTest = (test: GeneratedTest): void => {
  sessionStorage.setItem(CURRENT_TEST_KEY, JSON.stringify(test));
};

export const getCurrentTest = (): GeneratedTest | null => {
  const raw = sessionStorage.getItem(CURRENT_TEST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeneratedTest;
  } catch {
    return null;
  }
};

export const clearCurrentTest = (): void => {
  sessionStorage.removeItem(CURRENT_TEST_KEY);
};

export const saveLastResult = (result: SubmitTestResponse): void => {
  sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
};

export const getLastResult = (): SubmitTestResponse | null => {
  const raw = sessionStorage.getItem(LAST_RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SubmitTestResponse;
  } catch {
    return null;
  }
};

export const clearLastResult = (): void => {
  sessionStorage.removeItem(LAST_RESULT_KEY);
};
