import { axiosInstance } from './axios';
import { ApiResponse } from '../types/api.types';
import { AuthPayload, LoginRequest, RegisterRequest, User } from '../types/auth.types';

export const authApi = {
  async login(payload: LoginRequest): Promise<User> {
    const { data } = await axiosInstance.post<ApiResponse<AuthPayload>>('/auth/login', payload);
    return data.data.user;
  },

  async register(payload: RegisterRequest): Promise<User> {
    const { data } = await axiosInstance.post<ApiResponse<AuthPayload>>('/auth/register', payload);
    return data.data.user;
  },

  async getMe(): Promise<User> {
    const { data } = await axiosInstance.get<ApiResponse<User>>('/auth/me');
    return data.data;
  }
};
