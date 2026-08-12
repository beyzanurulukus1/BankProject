export interface LoginResponse {
    isSuccess: boolean;
    message: string;
    token: string;
    epiresAt: string;
  }