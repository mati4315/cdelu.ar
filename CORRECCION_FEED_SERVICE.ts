// 📁 src/services/feedService.ts
// 🔧 CORRECCIÓN CRÍTICA: Cambiar endpoint de likes

import { apiClient } from '@/lib/apiClient';
import type { FeedItem, FeedParams, FeedResponse, LikeResponse } from '@/types/feed';

export class FeedService {
  private request = apiClient;

  // ✅ MÉTODO CORREGIDO - Cambiar esta línea:
  async toggleLike(feedId: number): Promise<LikeResponse> {
    // ❌ ANTES (causa error 400):
    // return await this.request.post(`/feed/${feedId}/like`);
    
    // ✅ DESPUÉS (funciona correctamente):
    return await this.request.post(`/feed/${feedId}/like/toggle`);
  }

  // Otros métodos del servicio...
  async getFeed(params: FeedParams = {}): Promise<FeedResponse> {
    return await this.request.get('/feed', { params });
  }

  async getNews(params: FeedParams = {}): Promise<FeedResponse> {
    return await this.request.get('/feed/noticias', { params });
  }

  async getCommunity(params: FeedParams = {}): Promise<FeedResponse> {
    return await this.request.get('/feed/comunidad', { params });
  }

  async getFeedStats(): Promise<{ total: number; noticias: number; comunidad: number }> {
    return await this.request.get('/feed/stats');
  }

  async getFeedItem(id: number): Promise<FeedItem> {
    return await this.request.get(`/feed/${id}`);
  }

  async createComment(feedId: number, comment: { content: string }): Promise<any> {
    return await this.request.post(`/feed/${feedId}/comments`, comment);
  }

  async getComments(feedId: number): Promise<any[]> {
    return await this.request.get(`/feed/${feedId}/comments`);
  }
}

export const feedService = new FeedService();

// 🎯 TIPOS NECESARIOS (si no los tienes):
export interface LikeResponse {
  liked: boolean;
  likes_count: number;
  message: string;
}

export interface FeedParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  type?: number;
}

export interface FeedResponse {
  data: FeedItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FeedItem {
  id: number;
  original_id: number;
  type: number; // 1 = noticia, 2 = comunidad
  titulo: string;
  descripcion: string;
  user_name: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  video_url?: string;
} 