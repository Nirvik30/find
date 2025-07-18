// In your navigation component:

import { MessagesBadge } from '@/components/MessagesBadge';

// Inside your navigation links:
<li>
  <Link 
    to="/applicant/messages" 
    className="flex items-center gap-2"
  >
    <MessageCircle className="h-4 w-4" />
    <span>Messages</span>
    <MessagesBadge />
  </Link>
</li>