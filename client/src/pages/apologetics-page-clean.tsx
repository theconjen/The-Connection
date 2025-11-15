import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import MainLayout from "../components/layouts/main-layout";
import { ApologeticsResource } from "@connection/shared/schema";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import { apiUrl } from "../lib/env";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { 
  BookOpenIcon, 
  VideoIcon, 
  HeadphonesIcon, 
  ExternalLinkIcon,
} from "lucide-react";
import { RecommendedForYou } from "../components/RecommendedForYou";

export default function ApologeticsPage() {
  const { user } = useAuth();

  // Fetch apologetics resources
  const { data: resources, isLoading: resourcesLoading } = useQuery<ApologeticsResource[]>({
    queryKey: ['/api/apologetics/resources'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/apologetics/resources'));
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      return response.json();
    },
  });

  // Helper function to get resource icon
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpenIcon className="text-amber-500 mr-3 h-5 w-5" />;
      case 'video':
        return <VideoIcon className="text-red-500 mr-3 h-5 w-5" />;
      case 'podcast':
        return <HeadphonesIcon className="text-green-500 mr-3 h-5 w-5" />;
      default:
        return <BookOpenIcon className="text-amber-500 mr-3 h-5 w-5" />;
    }
  };

  return (
    <MainLayout>
      <div className="flex-1">
        {/* Recommended Content Section */}
        {user && (
          <div className="mb-8">
            <RecommendedForYou section="apologetics" maxItems={4} showHeader={true} />
          </div>
        )}

        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-blue-100 text-primary-900 p-8 md:p-12">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold mb-4 text-primary-900">Apologetics Resource Center</h1>
              <p className="text-primary-800 text-lg mb-6">
                Equipping believers with knowledge and resources to understand, explain, and defend the Christian faith with confidence and grace.
              </p>
              <p className="bg-primary-100 p-4 rounded text-primary-900 text-sm italic mb-6 border-l-4 border-primary-500 pl-4 shadow-sm">
                "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have." - 1 Peter 3:15
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-neutral-600">
              Our apologetics center provides carefully curated resources to help you grow in your understanding of Christian theology, answer difficult questions, and engage thoughtfully with those who are questioning.
            </p>
          </CardContent>
        </Card>

        {/* Resources Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Apologetics Resources</h2>
          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-52">
                  <CardContent className="p-4">
                    <div className="flex items-start mb-3">
                      <Skeleton className="h-10 w-10 rounded mr-3" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-8 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources?.map((resource) => (
                <Card key={resource.id} className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start mb-3">
                      {getResourceIcon(resource.type)}
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <p className="text-sm text-neutral-500 capitalize">{resource.type}</p>
                      </div>
                    </div>
                    <p className="text-neutral-600 text-sm mb-4">{resource.description}</p>
                    {resource.url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkIcon className="mr-2 h-4 w-4" />
                          View Resource
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
