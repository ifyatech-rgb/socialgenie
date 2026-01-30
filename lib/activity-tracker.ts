import { createClient } from "@/lib/supabase/server"

export type ActivityAction =
  | 'user.signup'
  | 'user.login'
  | 'user.logout'
  | 'script.generated'
  | 'script.viewed'
  | 'script.deleted'
  | 'video.requested'
  | 'video.completed'
  | 'video.downloaded'
  | 'credits.purchased'
  | 'plan.upgraded'
  | 'plan.cancelled'
  | 'profile.updated'
  | 'admin.action'

interface ActivityDetails {
  [key: string]: string | number | boolean | null | undefined
}

export async function logActivity(
  userId: string,
  action: ActivityAction,
  details?: ActivityDetails,
  request?: Request
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Extract IP and User Agent from request if available
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (request) {
      // Try various headers for IP
      ipAddress = 
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        null

      userAgent = request.headers.get('user-agent') || null
    }

    const { error } = await (supabase as any)
      .from('activity_logs')
      .insert({
        user_id: userId,
        action,
        details: details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (error) {
      console.error('Failed to log activity:', error)
      return { success: false, error: error.message }
    }

    // Also update last_active_at on the user profile
    await (supabase as any)
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)

    return { success: true }
  } catch (error) {
    // Non-blocking - just log the error
    console.error('Activity logging error:', error)
    return { success: false, error: 'Unknown error' }
  }
}

// Helper to get action label
export function getActionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    'user.signup': 'Signed up',
    'user.login': 'Logged in',
    'user.logout': 'Logged out',
    'script.generated': 'Generated script',
    'script.viewed': 'Viewed script',
    'script.deleted': 'Deleted script',
    'video.requested': 'Requested video',
    'video.completed': 'Video completed',
    'video.downloaded': 'Downloaded video',
    'credits.purchased': 'Purchased credits',
    'plan.upgraded': 'Upgraded plan',
    'plan.cancelled': 'Cancelled plan',
    'profile.updated': 'Updated profile',
    'admin.action': 'Admin action',
  }
  return labels[action] || action
}

// Helper to get action icon name
export function getActionIcon(action: ActivityAction): string {
  const icons: Record<ActivityAction, string> = {
    'user.signup': 'UserPlus',
    'user.login': 'LogIn',
    'user.logout': 'LogOut',
    'script.generated': 'FileText',
    'script.viewed': 'Eye',
    'script.deleted': 'Trash2',
    'video.requested': 'Video',
    'video.completed': 'CheckCircle',
    'video.downloaded': 'Download',
    'credits.purchased': 'CreditCard',
    'plan.upgraded': 'TrendingUp',
    'plan.cancelled': 'XCircle',
    'profile.updated': 'User',
    'admin.action': 'Shield',
  }
  return icons[action] || 'Activity'
}

// Helper to get action color
export function getActionColor(action: ActivityAction): string {
  if (action.startsWith('user.')) return 'blue'
  if (action.startsWith('script.')) return 'purple'
  if (action.startsWith('video.')) return 'pink'
  if (action.startsWith('credits.') || action.startsWith('plan.')) return 'green'
  return 'gray'
}

// Parse user agent to get device info
export function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'
  
  // Simple parsing - you could use a library for more accuracy
  if (userAgent.includes('iPhone')) return 'iPhone'
  if (userAgent.includes('iPad')) return 'iPad'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('Mac')) return 'Mac'
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Linux')) return 'Linux'
  
  return 'Desktop'
}

// Get browser from user agent
export function getBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  
  return 'Other'
}
