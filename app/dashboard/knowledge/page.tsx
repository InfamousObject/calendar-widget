'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Pin, Tag, FolderOpen, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  _count?: {
    articles: number;
  };
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  type: string;
  status: string;
  isPinned: boolean;
  tags?: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [newArticleOpen, setNewArticleOpen] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter, typeFilter]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch('/api/knowledge/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories);
      }

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      // Fetch articles
      const articlesResponse = await fetch(`/api/knowledge/articles?${params.toString()}`);
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData.articles);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const slug = newArticleTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const response = await fetch('/api/knowledge/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newArticleTitle,
          slug,
          content: '',
          status: 'draft',
        }),
      });

      if (response.ok) {
        const { article } = await response.json();
        toast.success('Article created!');
        setNewArticleOpen(false);
        setNewArticleTitle('');
        router.push(`/dashboard/knowledge/articles/${article.id}/edit`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to create article');
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/articles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Article deleted');
        fetchData();
      } else {
        toast.error('Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'faq':
        return <HelpCircle className="h-4 w-4" />;
      case 'webpage':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-tight">Knowledge Base</h1>
              </div>
              <p className="text-lg text-foreground-secondary font-light">
                Create and manage articles for your AI chatbot
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/knowledge/categories')}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
              <Dialog open={newArticleOpen} onOpenChange={setNewArticleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    New Article
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Article</DialogTitle>
                    <DialogDescription>
                      Enter a title for your new article. You can edit the content in the next step.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Article Title</Label>
                      <Input
                        value={newArticleTitle}
                        onChange={(e) => setNewArticleTitle(e.target.value)}
                        placeholder="How to book an appointment..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateArticle();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewArticleOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateArticle}>Create Article</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-display text-xl">Filter Articles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{articles.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-md hover:shadow-lg hover:border-success/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-success">
                {articles.filter((a) => a.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-md hover:shadow-lg hover:border-accent/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-accent">
                {articles.filter((a) => a.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground-secondary">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {articles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first knowledge base article to get started
                </p>
                <Button onClick={() => setNewArticleOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="border-border shadow-md hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {article.isPinned && (
                          <Pin className="h-4 w-4 text-yellow-500" />
                        )}
                        {getTypeIcon(article.type)}
                        <CardTitle className="text-xl font-display">{article.title}</CardTitle>
                      </div>
                      {article.excerpt && (
                        <CardDescription className="mt-2">{article.excerpt}</CardDescription>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                          {article.status}
                        </Badge>
                        {article.category && (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: article.category.color,
                              color: article.category.color,
                            }}
                          >
                            {article.category.name}
                          </Badge>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <>
                            {(article.tags as string[]).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/knowledge/articles/${article.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id, article.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
