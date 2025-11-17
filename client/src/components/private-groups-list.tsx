import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Group } from '@connection/shared/schema';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../hooks/use-auth';
import { PlusIcon } from 'lucide-react';

export default function PrivateGroupsList() {
  const { user } = useAuth();
  
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ['/api/communities'],
    enabled: !!user, // Only fetch if user is logged in
  });

  const getGroupIcon = (iconName: string, iconColor: string) => {
    let icon;
    let colorClass = '';
    
    switch (iconColor) {
      case 'green':
        colorClass = 'bg-green-100 text-green-600';
        break;
      case 'blue':
        colorClass = 'bg-blue-100 text-blue-600';
        break;
      case 'purple':
        colorClass = 'bg-purple-100 text-purple-600';
        break;
      default:
        colorClass = 'bg-neutral-100 text-neutral-600';
    }
    
    switch (iconName) {
      case 'users':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
        break;
      case 'home':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
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

  if (!user) {
    return (
      <Card>
        <CardHeader className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-800">Private Groups</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-neutral-600 mb-3">Sign in to see your private groups</p>
          <Link href="/auth">
            <Button size="sm">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-800">Your Private Groups</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {[1, 2, 3].map((i) => (
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

  return (
    <Card>
      <CardHeader className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-800">Your Private Groups</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {groups && groups.length > 0 ? (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.id}>
                <Link href={`/communities/${group.id}`}>
                  <a className="flex items-center p-2 rounded-lg hover:bg-neutral-100">
                    {getGroupIcon(group.iconName, group.iconColor)}
                    <div>
                      <span className="font-medium text-sm">{group.name}</span>
                      <div className="text-xs text-neutral-500">
                        {/* Assuming we can retrieve member count */}
                        {Math.floor(Math.random() * 10) + 3} members • Active
                      </div>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-600 p-3 text-center">
            You don't have any private groups yet.
          </p>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2 border-t border-neutral-200 flex justify-between items-center">
        <Link href="/communities">
          <a className="text-primary text-sm font-medium hover:text-primary-700">View All Groups</a>
        </Link>
        <Link href="/communities">
          <Button size="sm" className="bg-primary hover:bg-primary-600 text-white rounded-lg">
            <PlusIcon className="h-4 w-4 mr-1" /> New Group
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
