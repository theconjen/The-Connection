import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import MainLayout from "../components/layouts/main-layout";
import { ApologeticsResource, ApologeticsTopic, ApologeticsQuestion, User } from "@connection/shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Link } from "wouter";
import { 
  BookOpenIcon, 
  VideoIcon, 
  HeadphonesIcon, 
  ExternalLinkIcon, 
  MessagesSquareIcon,
  UserCheckIcon,
  ShieldQuestionIcon,
  BookIcon,
  AtomIcon,
  HeartHandshakeIcon
} from "lucide-react";
import { RecommendedForYou } from "../components/RecommendedForYou";

// Helper function to format dates
const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export default function ApologeticsPage() {
  const { user } = useAuth();
  const { data: resources, isLoading: resourcesLoading } = useQuery<ApologeticsResource[]>({
    queryKey: ['/api/apologetics'],
  });
  
  const { data: topics, isLoading: topicsLoading } = useQuery<ApologeticsTopic[]>({
    queryKey: ['/api/apologetics/topics'],
  });
  
  const { data: questions, isLoading: questionsLoading } = useQuery<ApologeticsQuestion[]>({
    queryKey: ['/api/apologetics/questions'],
  });
  
  const { data: verifiedAnswerers, isLoading: answererLoading } = useQuery<User[]>({
    queryKey: ['/api/users/verified-apologetics-answerers'],
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

  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'book':
        return <BookIcon className="text-primary-600 mr-3 h-5 w-5" />;
      case 'atom':
        return <AtomIcon className="text-blue-600 mr-3 h-5 w-5" />;
      case 'heart':
        return <HeartHandshakeIcon className="text-rose-600 mr-3 h-5 w-5" />;
      default:
        return <ShieldQuestionIcon className="text-amber-500 mr-3 h-5 w-5" />;
    }
  };

  const filterResourcesByType = (type: string) => {
    return resources?.filter(resource => resource.type === type) || [];
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
            <p className="text-neutral-600 mb-4">
              Our apologetics center provides carefully curated resources to help you grow in your understanding of Christian theology, answer difficult questions, and engage thoughtfully with those who are questioning.
            </p>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="resources" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="questions">Q&A</TabsTrigger>
            <TabsTrigger value="expert-answers">Expert Answers</TabsTrigger>
          </TabsList>
          
          {/* Resources Tab */}
          <TabsContent value="resources">
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Resources</TabsTrigger>
                <TabsTrigger value="books">Books</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <h2 className="text-2xl font-bold mb-4">All Apologetics Resources</h2>
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
              </TabsContent>

              <TabsContent value="books">
                <h2 id="books" className="text-2xl font-bold mb-4">Books</h2>
                {resourcesLoading ? (
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
                {resourcesLoading ? (
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
                {resourcesLoading ? (
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
          </TabsContent>
          
          {/* Q&A Tab */}
          <TabsContent value="questions">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Apologetics Questions & Answers</h2>
                <Button>
                  <ShieldQuestionIcon className="mr-2 h-4 w-4" />
                  Ask a Question
                </Button>
              </div>
              
              {/* Featured Topics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Featured Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topicsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="h-40">
                        <CardContent className="p-5">
                          <Skeleton className="h-8 w-8 mb-2" />
                          <Skeleton className="h-6 w-32 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))
                  ) : topics && topics.length > 0 ? (
                    topics.slice(0, 3).map((topic) => (
                      <Card key={topic.id} className="h-40 group hover:border-primary transition-colors">
                        <Link href={`/apologetics/topics/${topic.slug}`}>
                          <CardContent className="p-5 h-full flex flex-col">
                            <div className="mb-2">
                              {getTopicIcon(topic.iconName || 'default')}
                            </div>
                            <h4 className="font-semibold group-hover:text-primary transition-colors">{topic.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
                          </CardContent>
                        </Link>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 p-6 text-center border rounded-lg bg-muted/50">
                      <ShieldQuestionIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p>No topics available at the moment.</p>
                      {user?.isVerifiedApologeticsAnswerer && (
                        <Button variant="outline" className="mt-3">Create Topic</Button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* If there are more than 3 topics */}
                {topics && topics.length > 3 && (
                  <div className="mt-3 text-center">
                    <Button variant="outline">View All Topics</Button>
                  </div>
                )}
              </div>

              {/* Featured Questions */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Questions</h3>
                <div className="space-y-4">
                  {questionsLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i} className="h-28">
                        <CardContent className="p-5">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <div className="flex">
                            <Skeleton className="h-4 w-20 mr-4" />
                            <Skeleton className="h-4 w-24 mr-4" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : questions && questions.length > 0 ? (
                    questions.slice(0, 3).map((question) => {
                      // Find the associated topic
                      const topic = topics?.find(t => t.id === question.topicId);
                      
                      return (
                        <Card key={question.id}>
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                              <div>
                                <Link href={`/apologetics/questions/${question.id}`}>
                                  <h4 className="font-medium text-lg mb-1 hover:text-primary transition-colors">{question.title}</h4>
                                </Link>
                                <div className="flex items-center text-sm text-muted-foreground flex-wrap">
                                  {topic && (
                                    <>
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{topic.name}</span>
                                      <span className="mx-2">•</span>
                                    </>
                                  )}
                                  <span>Asked {formatDate(question.createdAt)}</span>
                                  <span className="mx-2">•</span>
                                  <span>{question.answerCount || 0} answers</span>
                                </div>
                              </div>
                              {question.status === 'answered' && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md flex items-center">
                                    <UserCheckIcon className="h-3 w-3 mr-1" />
                                    Verified Answer
                                  </span>
                                </div>
                              )}
                              {question.status === 'pending' && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
                                    Pending
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-5 text-center">
                        <p className="text-muted-foreground">No questions available</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="text-center mt-6">
                    <Button variant="outline">View All Questions</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Expert Answers Tab */}
          <TabsContent value="expert-answers">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Verified Expert Answers</h2>
                {user?.isVerifiedApologeticsAnswerer ? (
                  <Button variant="outline">
                    <UserCheckIcon className="mr-2 h-4 w-4" />
                    Expert Dashboard
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <div className="text-sm text-muted-foreground">Are you an apologetics expert?</div>
                    <Button variant="outline" size="sm">
                      Apply to Contribute
                    </Button>
                  </div>
                )}
              </div>
              
              <Card className="mb-6">
                <CardHeader className="bg-gradient-to-r from-primary-100 to-primary-50">
                  <CardTitle className="text-primary-800">About Our Verified Experts</CardTitle>
                  <CardDescription>
                    Our verified apologetics experts are theologians, scholars, and ministry leaders with expertise in various aspects of Christian apologetics. Their verified answers provide trusted guidance based on Biblical truth and scholarly research.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4 bg-green-50 border-green-100">
                      <h3 className="font-medium flex items-center text-green-800 mb-2">
                        <BookIcon className="mr-2 h-5 w-5" />
                        Biblical Faithfulness
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our experts are committed to the authority and inspiration of Scripture, providing answers that honor the Biblical text.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-amber-50 border-amber-100">
                      <h3 className="font-medium flex items-center text-amber-800 mb-2">
                        <AtomIcon className="mr-2 h-5 w-5" />
                        Academic Rigor
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Verified experts bring scholarly depth to complex topics, helping you understand difficult theological and scientific concepts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <h3 className="text-lg font-semibold mb-3">Featured Expert Answers</h3>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start">
                      <div className="bg-primary-100 p-2 rounded-full mr-4">
                        <UserCheckIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <h4 className="font-medium text-lg">How do we understand the days of creation in Genesis?</h4>
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Science and Faith</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Christians hold various views on the creation days in Genesis, including literal 24-hour days, day-age theory (where each "day" represents an age or epoch), and the framework interpretation (viewing the days as a literary framework rather than strictly chronological). All these views can be faithful to Scripture while interpreting the text differently...
                        </p>
                        <div className="flex items-center text-sm">
                          <span className="font-medium">Answered by Dr. Thomas Williams</span>
                          <span className="mx-1">•</span>
                          <span className="text-muted-foreground">Biblical Studies Professor</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start">
                      <div className="bg-primary-100 p-2 rounded-full mr-4">
                        <UserCheckIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <h4 className="font-medium text-lg">What evidence supports the reliability of the Gospels?</h4>
                          <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">Infallibility of Scripture</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          The Gospels demonstrate historical reliability through multiple lines of evidence, including their early composition (within the lifetime of eyewitnesses), archaeological confirmations of places and customs they describe, internal consistency despite being written by different authors, and extra-biblical historical references that confirm key events...
                        </p>
                        <div className="flex items-center text-sm">
                          <span className="font-medium">Answered by Sarah Johnson</span>
                          <span className="mx-1">•</span>
                          <span className="text-muted-foreground">New Testament Scholar</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="text-center mt-6">
                  <Button variant="outline">View More Expert Answers</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}