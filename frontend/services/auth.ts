/**
 * Auth 服务层
 * 封装 Supabase Auth 相关操作
 */
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

class AuthService {
  private supabase = createClient();

  /**
   * 使用 GitHub 登录
   */
  async signInWithGitHub() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('GitHub login error:', error);
      throw error;
    }

    return data;
  }

  /**
   * 登出
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) return null;

    return this.mapSupabaseUser(user);
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        callback(this.mapSupabaseUser(session.user));
      } else {
        callback(null);
      }
    });
  }

  /**
   * 将 Supabase User 映射为 AuthUser
   */
  private mapSupabaseUser(user: SupabaseUser): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    };
  }
}

export const authService = new AuthService();
