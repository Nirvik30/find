import React, { useEffect, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Badge } from '@/components/ui/badge';

interface MessagesBadgeProps {
  className?: string;
}

export function MessagesBadge({ className }: MessagesBadgeProps) {
  const { conversations } = useChat();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Calculate total unread messages
    const count = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    setUnreadCount(count);
  }, [conversations]);
  
  if (unreadCount === 0) return null;
  
  return (
    <Badge 
      variant="destructive" 
      className={`text-xs font-semibold ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}