import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
import { ApologeticsResource } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpenIcon, VideoIcon, HeadphonesIcon, ExternalLinkIcon } from "lucide-react";

export default function ApologeticsPage() {
  const { data: resources, isLoading } = useQuery<ApologeticsResource[]>({
    queryKey: ['/api/apologetics'],
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpenIcon className="text-amber-500 mr-3 h-5 w-5" />;
      case 'video':
        return <VideoIcon className="text-amber-500 mr-3 h-5 w-5" />;
      case 'podcast':
        return <HeadphonesIcon className="text-amber-500 mr-3 h-5 w-5" />;
      default:
        return <BookOpenIcon className="text-amber-500 mr-3 h-5 w-5" />;
    }
  };

  const filterResourcesByType = (type: string) => {
    return resources?.filter(resource => resource.type === type) || [];
  };

  return (
    <MainLayout>
      <div className="flex-1">
        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-primary-600 text-white p-8 md:p-12">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold mb-4">Apologetics Resource Center</h1>
              <p className="text-lg mb-6">
                Equipping believers with knowledge and resources to understand, explain, and defend the Christian faith with confidence and grace.
              </p>
              <p className="text-primary-100 text-sm italic mb-6">
                "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have." - 1 Peter 3:15
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-neutral-600 mb-4">
              Our apologetics center provides carefully curated resources to help you grow in your understanding of Christian theology, answer difficult questions, and engage thoughtfully with those who hold different beliefs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <a href="#books">
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  Books
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#videos">
                  <VideoIcon className="mr-2 h-4 w-4" />
                  Videos
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#podcasts">
                  <HeadphonesIcon className="mr-2 h-4 w-4" />
                  Podcasts
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different resource types */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <h2 className="text-2xl font-bold mb-4">All Apologetics Resources</h2>
            {isLoading ? (
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
          </TabsContent>

          <TabsContent value="books">
            <h2 id="books" className="text-2xl font-bold mb-4">Books</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="h-52">
                    <CardContent className="p-4">
                      <Skeleton className="h-8 w-40 mb-3" />
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
                {filterResourcesByType('book').map((resource) => (
                  <Card key={resource.id} className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start mb-3">
                        <BookOpenIcon className="text-amber-500 mr-3 h-5 w-5" />
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
          </TabsContent>

          <TabsContent value="videos">
            <h2 id="videos" className="text-2xl font-bold mb-4">Videos</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="h-52">
                    <CardContent className="p-4">
                      <Skeleton className="h-8 w-40 mb-3" />
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
                {filterResourcesByType('video').map((resource) => (
                  <Card key={resource.id} className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start mb-3">
                        <VideoIcon className="text-amber-500 mr-3 h-5 w-5" />
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
          </TabsContent>

          <TabsContent value="podcasts">
            <h2 id="podcasts" className="text-2xl font-bold mb-4">Podcasts</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="h-52">
                    <CardContent className="p-4">
                      <Skeleton className="h-8 w-40 mb-3" />
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
                {filterResourcesByType('podcast').map((resource) => (
                  <Card key={resource.id} className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start mb-3">
                        <HeadphonesIcon className="text-amber-500 mr-3 h-5 w-5" />
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
          </TabsContent>
        </Tabs>

        {/* Community Discussion Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Join the Conversation</CardTitle>
            <CardDescription>
              Discuss apologetics topics with other believers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Have questions about apologetics or want to discuss a specific topic? Join our apologetics community to connect with other believers interested in defending the faith.
            </p>
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 mb-4">
              <p className="text-neutral-700 italic">
                "For what can be known about God is plain to them, because God has shown it to them. For his invisible attributes, namely, his eternal power and divine nature, have been clearly perceived, ever since the creation of the world, in the things that have been made." - Romans 1:19-20
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/community/theology">
              <Button>
                Visit Theology Community
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        <Card>
          <CardHeader className="bg-primary-50 border-b border-primary-100">
            <CardTitle className="text-primary-800">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2">
              <li>
                <Link href="/community/theology">
                  <a className="flex items-center text-neutral-700 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-amber-500">
                      <path d="m2 22 10-10 10 10" />
                      <path d="M4 15v7" />
                      <path d="M20 15v7" />
                      <path d="M12 9v3" />
                      <path d="M12 3a6 6 0 0 1 1 3.142c0 .64-.057 1.11-.172 1.415-.114.306-.242.483-.242.483L12 9l-.586-.96s-.128-.177-.242-.483C11.057 7.252 11 6.782 11 6.142A6 6 0 0 1 12 3Z" />
                    </svg>
                    Theology Community
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/community/bible-study">
                  <a className="flex items-center text-neutral-700 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-green-600">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                    Bible Study Community
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/submit">
                  <a className="flex items-center text-neutral-700 hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-blue-600">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Submit a Question
                  </a>
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <PrivateGroupsList />
        <CommunityGuidelines />
      </aside>
    </MainLayout>
  );
}
