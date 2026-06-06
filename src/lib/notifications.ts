import { createServiceRoleClient } from './supabase-service';

function getSupabase() {
  return createServiceRoleClient();
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export async function createNotification(
  userId: string,
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata: metadata || {},
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create notification:', error);
    return null;
  }

  return data as Notification;
}

export async function getUnreadCount(userId: string) {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }

  return count || 0;
}

export async function markAsRead(notificationId: string) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllAsRead(userId: string) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Failed to mark all as read:', error);
    return false;
  }

  return true;
}
