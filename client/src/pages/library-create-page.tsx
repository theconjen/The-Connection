/**
 * Create/Edit Library Post Page (Web)
 * For authorized users to create and edit library posts
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Upload, Shield, Flame } from 'lucide-react';
import { apiClient } from '@shared/api/client';
import { queryKeys } from '@shared/api/queryKeys';
import type { Domain, CreateLibraryPostRequest } from '@shared/api/types';

const formSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']),
  title: z.string().min(1, 'Title is required').max(500),
  summary: z.string().max(1000).optional(),
  bodyMarkdown: z.string().min(1, 'Body content is required'),
  perspectives: z.string().optional(),
  sources: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function LibraryCreatePage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/library/create');
  const queryParams = new URLSearchParams(window.location.search);
  const postId = queryParams.get('id') ? parseInt(queryParams.get('id')!, 10) : undefined;
  const isEdit = !!postId;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user capabilities
  const { data: meData, isLoading: isLoadingMe } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.getMe(),
  });

  const canAuthor = meData?.capabilities.canAuthorApologeticsPosts || false;

  // Fetch existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: queryKeys.libraryPosts.detail(postId!),
    queryFn: async () => {
      return await apiClient.getLibraryPost(postId!);
    },
    enabled: isEdit && !isNaN(postId!),
  });

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: 'apologetics',
      title: '',
      summary: '',
      bodyMarkdown: '',
      perspectives: '',
      sources: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingPost && isEdit) {
      form.reset({
        domain: existingPost.domain,
        title: existingPost.title,
        summary: existingPost.summary || '',
        bodyMarkdown: existingPost.bodyMarkdown,
        perspectives: existingPost.perspectives?.join(', ') || '',
        sources: existingPost.sources
          ?.map((s) => `${s.title} | ${s.url} | ${s.author || ''} | ${s.date || ''}`)
          .join('\n') || '',
      });
    }
  }, [existingPost, isEdit, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateLibraryPostRequest) => {
      return await apiClient.createLibraryPost(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.all() });
      toast({
        title: 'Success',
        description: 'Library post created successfully!',
      });
      navigate('/library');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create library post',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CreateLibraryPostRequest>) => {
      return await apiClient.updateLibraryPost(postId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.detail(postId!) });
      toast({
        title: 'Success',
        description: 'Library post updated successfully!',
      });
      navigate(`/library/${postId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update library post',
        variant: 'destructive',
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.publishLibraryPost(postId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryPosts.detail(postId!) });
      toast({
        title: 'Success',
        description: 'Library post published successfully!',
      });
      navigate(`/library/${postId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish library post',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (formData: FormData) => {
    // Parse perspectives (comma-separated)
    const perspectives = formData.perspectives
      ?.split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0) || [];

    // Parse sources (line-separated, pipe-delimited)
    const sources = formData.sources
      ?.split('\n')
      .map((line) => {
        const [title, url, author, date] = line.split('|').map((s) => s?.trim());
        if (title && url) {
          return { title, url, author, date };
        }
        return null;
      })
      .filter((s): s is { title: string; url: string; author?: string; date?: string } => s !== null) || [];

    const data: CreateLibraryPostRequest = {
      domain: formData.domain,
      areaId: null,
      tagId: null,
      title: formData.title,
      summary: formData.summary || null,
      bodyMarkdown: formData.bodyMarkdown,
      perspectives,
      sources,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePublish = () => {
    if (!postId) return;

    if (window.confirm('Are you sure you want to publish this library post? Published posts are visible to all users.')) {
      publishMutation.mutate();
    }
  };

  if (isLoadingMe || isLoadingPost) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canAuthor) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to create library posts.
            </p>
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

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/library">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Post' : 'Create Post'}
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Library Post' : 'Create New Library Post'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Domain */}
            <div className="space-y-2">
              <Label>Domain</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={form.watch('domain') === 'apologetics' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => form.setValue('domain', 'apologetics')}
                >
                  <Shield className="h-4 w-4" />
                  Apologetics
                </Button>
                <Button
                  type="button"
                  variant={form.watch('domain') === 'polemics' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => form.setValue('domain', 'polemics')}
                >
                  <Flame className="h-4 w-4" />
                  Polemics
                </Button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter post title"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                placeholder="Brief summary (optional)"
                rows={3}
                {...form.register('summary')}
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="bodyMarkdown">Body (Markdown) *</Label>
              <Textarea
                id="bodyMarkdown"
                placeholder="# Markdown content&#10;&#10;Write your article here..."
                rows={15}
                className="font-mono text-sm"
                {...form.register('bodyMarkdown')}
              />
              {form.formState.errors.bodyMarkdown && (
                <p className="text-sm text-red-600">{form.formState.errors.bodyMarkdown.message}</p>
              )}
              <p className="text-sm text-gray-600">
                Use Markdown formatting: # Headings, **bold**, *italic*, [link](url), etc.
              </p>
            </div>

            {/* Perspectives */}
            <div className="space-y-2">
              <Label htmlFor="perspectives">Perspectives (comma-separated)</Label>
              <Input
                id="perspectives"
                placeholder="Reformed, Catholic, Orthodox"
                {...form.register('perspectives')}
              />
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <Label htmlFor="sources">Sources (one per line)</Label>
              <Textarea
                id="sources"
                placeholder="Title | URL | Author | Date&#10;Example: Book Name | https://example.com | John Doe | 2024"
                rows={4}
                {...form.register('sources')}
              />
              <p className="text-sm text-gray-600">
                Format: Title | URL | Author (optional) | Date (optional)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEdit ? 'Update' : 'Create'} Draft
              </Button>
              {isEdit && existingPost?.status === 'draft' && (
                <Button
                  type="button"
                  variant="default"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Publish
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
