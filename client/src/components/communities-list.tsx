import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Community } from '@connection/shared/schema';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ContentActions } from '@/components/moderation/ContentActions';
import { useBlockedUserIds } from '@/hooks/use-blocked-users';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunitiesList() {
  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = queryClient;

  const getCommunityIcon = (iconName: string, iconColor: string) => {
    let icon;
    let colorClass = '';
    
    switch (iconColor) {
      case 'primary':
        colorClass = 'bg-primary-100 text-primary-600';
        break;
      case 'secondary':
        colorClass = 'bg-green-100 text-green-600';
        break;
      case 'accent':
        colorClass = 'bg-amber-100 text-amber-600';
        break;
      case 'red':
        colorClass = 'bg-red-100 text-red-500';
        break;
      default:
        colorClass = 'bg-neutral-100 text-neutral-600';
    }
    
    switch (iconName) {
      case 'pray':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 2v1" />
            <path d="M12 21v-1" />
            <path d="M3.3 7.8c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M20.7 16.2c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M3.3 16.2c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M20.7 7.8c-.4-1 .1-2 1-2.4 1-.4 2 .1 2.4 1 .4 1-.1 2-1 2.4-1 .4-2-.1-2.4-1Z" />
            <path d="M9 15.9a4 4 0 0 0 6 0" />
            <path d="M17 10c.7-.7.7-1.3 0-2" />
            <path d="M7 8c-.7.7-.7 1.3 0 2" />
          </svg>
        );
        break;
      case 'book':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        );
        break;
      case 'church':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m2 22 10-10 10 10" />
            <path d="M4 15v7" />
            <path d="M20 15v7" />
            <path d="M12 9v3" />
            <path d="M12 3a6 6 0 0 1 1 3.142c0 .64-.057 1.11-.172 1.415-.114.306-.242.483-.242.483L12 9l-.586-.96s-.128-.177-.242-.483C11.057 7.252 11 6.782 11 6.142A6 6 0 0 1 12 3Z" />
          </svg>
        );
        break;
      case 'heart':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
        break;
      default:
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
    
    return (
      <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center mr-3`}>
        {icon}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-800">Popular Communities</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center p-2 rounded-lg">
              <Skeleton className="w-8 h-8 rounded-full mr-3" />
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const { blockedIds, addBlocked, removeBlocked } = useBlockedUserIds();

  return (
    <Card>
      <CardHeader className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-800">Popular Communities</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="space-y-1">
          {communities
            ?.filter(c => !blockedIds.includes(c.createdBy))
            .map((community) => (
            <li key={community.id} className="flex items-center justify-between">
              <Link href={`/community/${community.slug}`}>
                <a className="flex items-center p-2 rounded-lg hover:bg-neutral-100 flex-1">
                  {getCommunityIcon(community.iconName, community.iconColor)}
                  <div>
                    <span className="font-medium text-sm">r/{community.slug}</span>
                    <div className="text-xs text-neutral-500">{community.memberCount} members</div>
                  </div>
                </a>
              </Link>
              <div className="ml-3">
                <ContentActions
                  contentId={community.id}
                  contentType="community"
                  authorId={community.createdBy}
                  authorName={`user_${community.createdBy}`}
                  currentUserId={user?.id}
                  onBlockStatusChange={(userId, isBlocked) => {
                    if (isBlocked) addBlocked(userId); else removeBlocked(userId);
                    qc.invalidateQueries();
                    toast({ title: isBlocked ? 'User blocked' : 'User unblocked' });
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-neutral-200 mt-2">
          <Link href="/communities">
            <a className="text-primary text-sm font-medium hover:text-primary-700">View All Communities</a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
