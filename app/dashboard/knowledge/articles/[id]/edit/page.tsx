'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  type: string;
  status: string;
  isPinned: boolean;
  tags?: string[];
  url?: string;
  metadata?: any;
}

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch('/api/knowledge/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories);
      }

      // Fetch article
      const articleResponse = await fetch(`/api/knowledge/articles/${articleId}`);
      if (articleResponse.ok) {
        const articleData = await articleResponse.json();
        setArticle(articleData.article);
      } else {
        toast.error('Article not found');
        router.push('/dashboard/knowledge');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!article) return;

    if (!article.title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Only require content when publishing
    const targetStatus = newStatus || article.status;
    if (targetStatus === 'published' && !article.content.trim()) {
      toast.error('Content is required to publish');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/knowledge/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt || undefined,
          categoryId: article.categoryId || null,
          type: article.type,
          status: newStatus || article.status,
          isPinned: article.isPinned,
          tags: article.tags || undefined,
          url: article.url || null,
          metadata: article.metadata || null,
        }),
      });

      if (response.ok) {
        toast.success('Article saved!');
        fetchData(); // Refresh to get updated data
      } else {
        const errorData = await response.json();
        console.error('Validation error:', errorData);
        if (errorData.details) {
          toast.error(`Validation failed: ${errorData.details[0]?.message || 'Invalid data'}`);
        } else {
          toast.error(errorData.error || 'Failed to save article');
        }
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (newTitle: string) => {
    if (!article) return;
    setArticle({
      ...article,
      title: newTitle,
      slug: generateSlug(newTitle),
    });
  };

  const addTag = () => {
    if (!article || !tagInput.trim()) return;

    const tags = article.tags || [];
    if (!tags.includes(tagInput.trim())) {
      setArticle({
        ...article,
        tags: [...tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (!article) return;
    setArticle({
      ...article,
      tags: (article.tags || []).filter((tag) => tag !== tagToRemove),
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/knowledge')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Article</h1>
              <p className="text-muted-foreground mt-1">
                Update your knowledge base article
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave()}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {article.status === 'draft' && (
              <Button onClick={() => handleSave('published')}>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
            {article.status === 'published' && (
              <Button variant="outline" onClick={() => handleSave('draft')}>
                Unpublish
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={article.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="How to book an appointment..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL slug: {article.slug}
                  </p>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={article.excerpt || ''}
                    onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
                    placeholder="Brief summary of the article..."
                    rows={2}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={article.content}
                    onChange={(e) => setArticle({ ...article, content: e.target.value })}
                    placeholder="Write your article content here..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports markdown formatting
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={article.status}
                    onValueChange={(value) => setArticle({ ...article, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={article.type}
                    onValueChange={(value) => setArticle({ ...article, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="webpage">Webpage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pin */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pinned"
                    checked={article.isPinned}
                    onCheckedChange={(checked) =>
                      setArticle({ ...article, isPinned: checked as boolean })
                    }
                  />
                  <Label htmlFor="pinned" className="cursor-pointer">
                    Pin to top
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Add tags to organize articles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(article.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* External URL */}
            <Card>
              <CardHeader>
                <CardTitle>External Source</CardTitle>
                <CardDescription>Link to external webpage (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="url"
                  value={article.url || ''}
                  onChange={(e) => setArticle({ ...article, url: e.target.value })}
                  placeholder="https://example.com/page"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
