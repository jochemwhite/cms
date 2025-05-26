type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type { ActionResponse };