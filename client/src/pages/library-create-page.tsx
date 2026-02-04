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
import { Loader2, ArrowLeft, Save, Upload, Shield, Flame, Zap, List, BookOpen, FileText, Users, Library, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { RubricAuditReport, AutoFixSuggestion } from '@shared/rubricConfig';

type Domain = 'apologetics' | 'polemics';

// Draft schema - only title required, other fields optional
const formSchema = z.object({
  domain: z.enum(['apologetics', 'polemics']),
  title: z.string().min(1, 'Title is required').max(500),
  tldr: z.string().max(2000, 'Quick Answer must be 2000 characters or less').optional(),
  keyPoints: z.string().optional(),
  scriptureRefs: z.string().optional(),
  bodyMarkdown: z.string().optional(),
  perspectives: z.string().optional(),
  sources: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type CreateLibraryPostRequest = {
  domain: 'apologetics' | 'polemics';
  areaId: number | null;
  tagId: number | null;
  title: string;
  tldr: string | null;
  keyPoints: string[];
  scriptureRefs: string[];
  summary: string | null;
  bodyMarkdown: string;
  perspectives: string[];
  sources: { title: string; url: string; author?: string; date?: string }[];
};

export default function LibraryCreatePage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/library/create');
  const queryParams = new URLSearchParams(window.location.search);
  const postId = queryParams.get('id') ? parseInt(queryParams.get('id')!, 10) : undefined;
  const isEdit = !!postId;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingMe } = useAuth();

  // Admins, verified apologists, and user 19 can author library posts
  const canAuthor =
    user?.role === 'admin' ||
    user?.isVerifiedApologeticsAnswerer ||
    user?.id === 19 ||
    ((user as any)?.permissions?.includes?.('apologetics_post_access') ?? false);

  // Fetch existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['/api/library/posts', postId],
    queryFn: async () => {
      const res = await fetch(`/api/library/posts/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
    enabled: isEdit && !isNaN(postId!),
  });

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: 'apologetics',
      title: '',
      tldr: '',
      keyPoints: '',
      scriptureRefs: '',
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
        tldr: existingPost.tldr || '',
        keyPoints: existingPost.keyPoints?.join('\n') || '',
        scriptureRefs: existingPost.scriptureRefs?.join(', ') || '',
        bodyMarkdown: existingPost.bodyMarkdown,
        perspectives: existingPost.perspectives?.join(', ') || '',
        sources: existingPost.sources
          ?.map((s: any) => `${s.title} | ${s.url} | ${s.author || ''} | ${s.date || ''}`)
          .join('\n') || '',
      });
    }
  }, [existingPost, isEdit, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/library/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/posts'] });
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
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/library/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to update post');
      }
      return res.json();
    },
    onSuccess: (updatedPost) => {
      // Use the PATCH response directly to avoid read-after-write staleness.
      // Merge with existing cached data to preserve joined fields (area, tag, contributions).
      queryClient.setQueryData(['/api/library/posts', postId], (old: any) => {
        if (!old) return updatedPost;
        return { ...old, ...updatedPost };
      });
      queryClient.invalidateQueries({ queryKey: ['/api/library/posts'] });
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

  // Rubric evaluation state
  const [auditReport, setAuditReport] = useState<RubricAuditReport | null>(null);
  const [autoFixSuggestions, setAutoFixSuggestions] = useState<AutoFixSuggestion[]>([]);
  const [qualityPanelOpen, setQualityPanelOpen] = useState(false);
  const [forcePublishOpen, setForcePublishOpen] = useState(false);
  const [forcePublishReason, setForcePublishReason] = useState('');

  // Load existing rubric report from server when editing
  useEffect(() => {
    if (existingPost?.rubricReport) {
      setAuditReport(existingPost.rubricReport as RubricAuditReport);
      setQualityPanelOpen(true);
    }
  }, [existingPost]);

  // Publish mutation (handles 422 rubric failure)
  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/library/posts/${postId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status === 422) {
        const body = await res.json();
        // Set the audit report and show panel
        if (body.auditReport) {
          setAuditReport(body.auditReport);
          setQualityPanelOpen(true);
        }
        throw new Error('Post did not pass quality check. Review the issues below.');
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to publish post');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.auditReport) {
        setAuditReport(data.auditReport);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/library/posts'] });
      toast({
        title: 'Success',
        description: 'Library post published successfully!',
      });
      navigate(`/library/${postId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Quality Check Failed',
        description: error.message || 'Failed to publish library post',
        variant: 'destructive',
      });
    },
  });

  // Evaluate mutation (dry-run)
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/library/posts/${postId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to evaluate post');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAuditReport(data.auditReport);
      setQualityPanelOpen(true);
      toast({
        title: data.auditReport.passed ? 'Quality Check Passed' : 'Quality Check Issues Found',
        description: `Score: ${data.auditReport.totalScore}/100`,
        variant: data.auditReport.passed ? 'default' : 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run quality check',
        variant: 'destructive',
      });
    },
  });

  // Auto-fix mutation
  const autoFixMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/library/posts/${postId}/auto-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to generate suggestions');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAutoFixSuggestions(data.suggestions || []);
      toast({
        title: 'Suggestions Ready',
        description: `${data.suggestions?.length || 0} improvement suggestions generated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate auto-fix suggestions',
        variant: 'destructive',
      });
    },
  });

  // Force-publish mutation (admin only)
  const forcePublishMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/library/posts/${postId}/force-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to force-publish');
      }
      return res.json();
    },
    onSuccess: () => {
      setForcePublishOpen(false);
      setForcePublishReason('');
      queryClient.invalidateQueries({ queryKey: ['/api/library/posts'] });
      toast({
        title: 'Force Published',
        description: 'Post published with admin override.',
      });
      navigate(`/library/${postId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to force-publish',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (formData: FormData) => {
    console.info('[LIBRARY FORM] onSubmit called, formData:', {
      domain: formData.domain,
      title: formData.title,
      tldr: formData.tldr?.slice(0, 50),
      bodyMarkdownLength: formData.bodyMarkdown?.length,
      keyPoints: formData.keyPoints?.slice(0, 100),
    });

    // Parse key points (line-separated)
    const keyPoints = formData.keyPoints
      ?.split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0) || [];

    // For published posts, validate that required fields aren't being removed
    if (existingPost?.status === 'published') {
      const errors: string[] = [];

      if (!formData.tldr || formData.tldr.trim().length === 0) {
        errors.push('Quick Answer (TL;DR) cannot be empty for published posts');
      }

      if (keyPoints.length < 3) {
        errors.push(`Published posts require 3-5 Key Points (you have ${keyPoints.length})`);
      } else if (keyPoints.length > 5) {
        errors.push(`Maximum 5 Key Points allowed (you have ${keyPoints.length})`);
      }

      if (!formData.bodyMarkdown || formData.bodyMarkdown.trim().length === 0) {
        errors.push('Detailed Answer cannot be empty for published posts');
      }

      if (errors.length > 0) {
        toast({
          title: 'Cannot Save',
          description: errors.join('. '),
          variant: 'destructive',
        });
        return;
      }
    }

    // Parse scripture references (comma-separated)
    const scriptureRefs = formData.scriptureRefs
      ?.split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0) || [];

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
      tldr: formData.tldr || null,
      keyPoints,
      scriptureRefs,
      summary: null,
      bodyMarkdown: formData.bodyMarkdown || '',
      perspectives,
      sources,
    };

    console.info('[LIBRARY FORM] Submitting data:', {
      isEdit,
      postId,
      dataKeys: Object.keys(data),
      bodyMarkdownLength: data.bodyMarkdown?.length,
      keyPointsCount: data.keyPoints?.length,
      sourcesCount: data.sources?.length,
    });

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePublish = () => {
    if (!postId) return;

    // Validate required fields before publishing
    const currentValues = form.getValues();
    const keyPoints = currentValues.keyPoints
      ?.split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0) || [];

    const errors: string[] = [];

    if (!currentValues.tldr || currentValues.tldr.trim().length === 0) {
      errors.push('Quick Answer (TL;DR) is required');
    }

    if (keyPoints.length < 3) {
      errors.push(`At least 3 Key Points required (you have ${keyPoints.length})`);
    } else if (keyPoints.length > 5) {
      errors.push(`Maximum 5 Key Points allowed (you have ${keyPoints.length})`);
    }

    if (!currentValues.bodyMarkdown || currentValues.bodyMarkdown.trim().length === 0) {
      errors.push('Detailed Answer is required');
    }

    if (errors.length > 0) {
      toast({
        title: 'Cannot Publish',
        description: errors.join('. '),
        variant: 'destructive',
      });
      return;
    }

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

  const isAdmin = user?.role === 'admin' || user?.id === 19;

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

      {/* Published Post Warning */}
      {isEdit && existingPost?.status === 'published' && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium">
            This post is published and visible to all users.
          </p>
          <p className="text-amber-700 text-sm mt-1">
            Changes you save will be live immediately.
          </p>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Library Post' : 'Create New Library Post'}</CardTitle>
          {existingPost?.status === 'published' ? (
            <p className="text-sm text-muted-foreground mt-2">
              Update the published article. Changes will be visible immediately after saving.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Save your work as a draft at any time. Only the title is required to save a draft.
              To publish, you'll need: Quick Answer, 3-5 Key Points, and Detailed Answer.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error('[LIBRARY FORM] Validation errors:', errors);
            toast({
              title: 'Validation Error',
              description: Object.values(errors).map((e: any) => e.message).filter(Boolean).join(', ') || 'Please check your form fields',
              variant: 'destructive',
            });
          })} className="space-y-6">
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
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter post title (e.g., 'What is the Trinity?')"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* TL;DR / Quick Answer */}
            <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label htmlFor="tldr" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Quick Answer (TL;DR)
                <span className="text-xs text-amber-600 font-normal">(required to publish)</span>
              </Label>
              <Textarea
                id="tldr"
                placeholder="A brief 1-2 sentence answer that gives readers the key takeaway immediately"
                rows={3}
                {...form.register('tldr')}
              />
              <p className="text-sm text-gray-600">
                This appears at the top of the article as a quick summary for readers in a hurry.
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-2">
              <Label htmlFor="keyPoints" className="flex items-center gap-2">
                <List className="h-4 w-4 text-primary" />
                Key Points (one per line)
                <span className="text-xs text-amber-600 font-normal">(3-5 required to publish)</span>
              </Label>
              <Textarea
                id="keyPoints"
                placeholder="The Trinity is one God in three persons&#10;Each person is fully God&#10;The three persons are distinct but not separate&#10;This doctrine is biblical and essential"
                rows={5}
                {...form.register('keyPoints')}
              />
              <p className="text-sm text-gray-600">
                Enter 3-5 main points, one per line. These appear as a numbered list.
              </p>
            </div>

            {/* Scripture References */}
            <div className="space-y-2">
              <Label htmlFor="scriptureRefs" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Scripture References (comma-separated)
              </Label>
              <Input
                id="scriptureRefs"
                placeholder="Matthew 28:19, John 1:1, Genesis 1:26, 2 Corinthians 13:14"
                {...form.register('scriptureRefs')}
              />
              <p className="text-sm text-gray-600">
                List relevant Bible verses that support this topic.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="bodyMarkdown" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Detailed Answer (Markdown)
                <span className="text-xs text-amber-600 font-normal">(required to publish)</span>
              </Label>
              <MarkdownEditor
                id="bodyMarkdown"
                value={form.watch('bodyMarkdown') || ''}
                onChange={(val) => form.setValue('bodyMarkdown', val, { shouldDirty: true })}
                placeholder="## Introduction&#10;&#10;Write your detailed explanation here..."
                rows={20}
              />
              {form.formState.errors.bodyMarkdown && (
                <p className="text-sm text-red-600">{form.formState.errors.bodyMarkdown.message}</p>
              )}
            </div>

            {/* Perspectives */}
            <div className="space-y-2">
              <Label htmlFor="perspectives" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Perspectives (comma-separated)
              </Label>
              <Input
                id="perspectives"
                placeholder="Reformed, Catholic, Orthodox, Evangelical"
                {...form.register('perspectives')}
              />
              <p className="text-sm text-gray-600">
                Different theological perspectives on this topic.
              </p>
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <Label htmlFor="sources" className="flex items-center gap-2">
                <Library className="h-4 w-4 text-primary" />
                Sources (one per line)
              </Label>
              <Textarea
                id="sources"
                placeholder="Systematic Theology | https://example.com/book | Wayne Grudem | 1994&#10;The Trinity | https://example.com/article | R.C. Sproul | 2020"
                rows={4}
                {...form.register('sources')}
              />
              <p className="text-sm text-gray-600">
                Format: Title | URL | Author (optional) | Year (optional)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className={`flex-1 gap-2 ${existingPost?.status === 'published' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {existingPost?.status === 'published'
                  ? 'Save Changes (Live)'
                  : isEdit
                    ? 'Update Draft'
                    : 'Create Draft'}
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

      {/* Quality Check Panel — only for user 19 (research team) posts */}
      {isEdit && postId && (user?.id === 19 || isAdmin) && (
        <Card className="mt-6">
          <Collapsible open={qualityPanelOpen} onOpenChange={setQualityPanelOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5" />
                    Quality Check
                    {auditReport && !auditReport.skipped && (
                      <Badge variant={auditReport.passed ? 'default' : 'destructive'} className="ml-2">
                        {auditReport.passed ? 'Passed' : 'Failed'} — {auditReport.totalScore}/100
                      </Badge>
                    )}
                  </CardTitle>
                  {qualityPanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Run Evaluation Button */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => evaluateMutation.mutate()}
                    disabled={evaluateMutation.isPending}
                  >
                    {evaluateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {evaluateMutation.isPending ? 'Evaluating...' : 'Run Quality Check'}
                  </Button>

                  {auditReport && !auditReport.passed && !auditReport.skipped && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => autoFixMutation.mutate()}
                      disabled={autoFixMutation.isPending}
                    >
                      {autoFixMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {autoFixMutation.isPending ? 'Generating...' : 'Get Auto-Fix Suggestions'}
                    </Button>
                  )}

                  {isAdmin && auditReport && !auditReport.passed && existingPost?.status !== 'published' && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2 ml-auto"
                      onClick={() => setForcePublishOpen(true)}
                    >
                      <Shield className="h-4 w-4" />
                      Force Publish
                    </Button>
                  )}
                </div>

                {/* Score Display */}
                {auditReport && !auditReport.skipped && (
                  <div className="space-y-4">
                    {/* Overall Score Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Score</span>
                        <span className={`font-bold ${
                          auditReport.totalScore >= 70 ? 'text-green-600' :
                          auditReport.totalScore >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {auditReport.totalScore}/100
                        </span>
                      </div>
                      <Progress
                        value={auditReport.totalScore}
                        className={`h-3 ${
                          auditReport.totalScore >= 70 ? '[&>div]:bg-green-500' :
                          auditReport.totalScore >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>

                    {/* Violations */}
                    {auditReport.violations.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                        <h4 className="font-medium text-red-800 flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Violations (must fix)
                        </h4>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                          {auditReport.violations.map((v, i) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {auditReport.suggestions.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                        <h4 className="font-medium text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Suggestions (optional improvements)
                        </h4>
                        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                          {auditReport.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Category Breakdown */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Category Breakdown</h4>
                      {auditReport.categoryScores.map((cat) => (
                        <Collapsible key={cat.categoryId}>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                              <span className="text-sm font-medium">{cat.categoryId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                  cat.score >= 70 ? 'text-green-600' :
                                  cat.score >= 50 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {Math.round(cat.score)}/100
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  w: {cat.weight}
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-4 pb-2 space-y-2">
                              <p className="text-sm text-muted-foreground">{cat.feedback}</p>
                              {cat.criteriaResults.map((cr) => (
                                <div key={cr.criteriaId} className="flex items-start gap-2 text-xs">
                                  {cr.score >= cr.maxPoints * 0.7 ? (
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-medium">{cr.criteriaId.replace(/_/g, ' ')}</span>
                                    <span className="text-muted-foreground"> ({cr.score}/{cr.maxPoints})</span>
                                    {cr.feedback && <p className="text-muted-foreground mt-0.5">{cr.feedback}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>

                    {/* Auto-Fix Suggestions */}
                    {autoFixSuggestions.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <h4 className="font-medium text-blue-800 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Auto-Fix Suggestions
                        </h4>
                        <div className="space-y-3">
                          {autoFixSuggestions.map((fix, i) => (
                            <div key={i} className="text-sm border-l-2 border-blue-300 pl-3">
                              <p className="font-medium text-blue-900">
                                Field: <code className="bg-blue-100 px-1 rounded">{fix.field}</code>
                              </p>
                              <p className="text-blue-800">Issue: {fix.issue}</p>
                              <p className="text-blue-700">Suggestion: {fix.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {auditReport?.skipped && (
                  <p className="text-sm text-muted-foreground">
                    Quality check was skipped (no AI API key configured). Post may be published without evaluation.
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Force Publish Dialog */}
      <Dialog open={forcePublishOpen} onOpenChange={setForcePublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Publish Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This post did not pass the quality check (score: {auditReport?.totalScore}/100).
              As an admin, you can override and publish it. Please provide a reason for the override.
            </p>
            <div className="space-y-2">
              <Label htmlFor="force-publish-reason">Override Reason</Label>
              <Textarea
                id="force-publish-reason"
                placeholder="e.g., Reviewed manually and content meets standards..."
                value={forcePublishReason}
                onChange={(e) => setForcePublishReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForcePublishOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => forcePublishMutation.mutate(forcePublishReason)}
              disabled={!forcePublishReason.trim() || forcePublishMutation.isPending}
            >
              {forcePublishMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Force Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
