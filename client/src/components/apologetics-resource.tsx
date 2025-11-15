import { useQuery } from '@tanstack/react-query';
import { ApologeticsResource } from '@connection/shared/schema';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpenIcon, VideoIcon, HeadphonesIcon } from 'lucide-react';

export default function ApologeticsResourceCard() {
  const { data: resources, isLoading } = useQuery<ApologeticsResource[]>({
    queryKey: ['/api/apologetics'],
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpenIcon className="text-amber-500 mr-2 h-4 w-4" />;
      case 'video':
        return <VideoIcon className="text-amber-500 mr-2 h-4 w-4" />;
      case 'podcast':
        return <HeadphonesIcon className="text-amber-500 mr-2 h-4 w-4" />;
      default:
        return <BookOpenIcon className="text-amber-500 mr-2 h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-4 py-3 bg-primary-50 border-b border-primary-100">
          <CardTitle className="font-semibold text-primary-800">Apologetics Center</CardTitle>
        </CardHeader>
        <div className="w-full h-32 bg-neutral-200 animate-pulse" />
        <CardContent className="p-4">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 py-3 bg-primary-50 border-b border-primary-100">
        <CardTitle className="font-semibold text-primary-800">Apologetics Center</CardTitle>
      </CardHeader>
      <img 
        src="https://images.unsplash.com/photo-1585858229735-cd08d8cb510d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200" 
        alt="Bible study resources and notes" 
        className="w-full h-32 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="font-medium mb-2">Recommended Resources</h3>
        <ul className="space-y-2 text-sm">
          {resources?.slice(0, 3).map((resource) => (
            <li key={resource.id} className="flex items-center">
              {getResourceIcon(resource.type)}
              <a 
                href={resource.url || '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-700 hover:text-primary"
              >
                {resource.title}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Link href="/apologetics" className="text-primary text-sm font-medium hover:text-primary-700">
            Visit Apologetics Center →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
