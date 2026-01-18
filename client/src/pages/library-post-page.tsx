/**
 * Library Post Detail Page (Web)
 * View full content of a library post with markdown rendering
 */

import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Shield, Flame, ExternalLink, Edit, Calendar } from 'lucide-react';
import { apiClient } from '@shared/api/client';
import { queryKeys } from '@shared/api/queryKeys';
import type { LibraryPost } from '@shared/api/types';

export default function LibraryPostPage() {
  const [, params] = useRoute('/library/:id');
  const postId = params?.id ? parseInt(params.id, 10) : undefined;

  // Fetch current user capabilities
  const { data: meData } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.getMe(),
  });

  // Fetch library post
  const { data: post, isLoading } = useQuery<LibraryPost>({
    queryKey: queryKeys.libraryPosts.detail(postId!),
    queryFn: async () => {
      return await apiClient.getLibraryPost(postId!);
    },
    enabled: !isNaN(postId!),
  });

  const canEdit =
    meData?.capabilities.canAuthorApologeticsPosts &&
    post?.authorUserId === meData?.user.id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
            <Link href="/library">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/library">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        {canEdit && (
          <Link href={`/library/create?id=${post.id}`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Post Content */}
      <article className="bg-white rounded-lg shadow-sm border p-8">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <Badge
            variant={post.domain === 'apologetics' ? 'default' : 'destructive'}
            className="gap-1"
          >
            {post.domain === 'apologetics' ? (
              <Shield className="h-3 w-3" />
            ) : (
              <Flame className="h-3 w-3" />
            )}
            {post.domain}
          </Badge>
          {post.area && (
            <span className="text-sm text-gray-600">{post.area.name}</span>
          )}
          {post.tag && (
            <Badge variant="outline" className="text-primary">
              #{post.tag.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Summary */}
        {post.summary && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
            <p className="text-lg text-gray-700 italic">{post.summary}</p>
          </div>
        )}

        {/* Author & Date */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b">
          <div>
            <p className="text-sm font-medium text-gray-900">{post.authorDisplayName}</p>
            {post.publishedAt && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Published {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-lg max-w-none mb-8">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
              h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
              h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />,
              p: ({ ...props }) => <p className="mb-4 leading-relaxed text-gray-700" {...props} />,
              ul: ({ ...props }) => <ul className="mb-4 ml-6 space-y-2" {...props} />,
              ol: ({ ...props }) => <ol className="mb-4 ml-6 space-y-2" {...props} />,
              li: ({ ...props }) => <li className="text-gray-700" {...props} />,
              a: ({ ...props }) => (
                <a
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              blockquote: ({ ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4"
                  {...props}
                />
              ),
              code: ({ inline, ...props }: any) =>
                inline ? (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm" {...props} />
                ) : (
                  <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto" {...props} />
                ),
            }}
          >
            {post.bodyMarkdown}
          </ReactMarkdown>
        </div>

        {/* Perspectives */}
        {post.perspectives && post.perspectives.length > 0 && (
          <div className="mb-8">
            <Separator className="mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Perspectives Considered
            </h2>
            <div className="flex flex-wrap gap-2">
              {post.perspectives.map((perspective, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                  {perspective}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {post.sources && post.sources.length > 0 && (
          <div>
            <Separator className="mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sources & References
            </h2>
            <div className="space-y-3">
              {post.sources.map((source, index) => (
                <Card key={index} className="border-l-4 border-blue-500">
                  <CardContent className="p-4">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 group"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {source.title}
                        </p>
                        {source.author && (
                          <p className="text-sm text-gray-600 mt-1">By {source.author}</p>
                        )}
                        {source.date && (
                          <p className="text-xs text-gray-500 mt-1">{source.date}</p>
                        )}
                      </div>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
