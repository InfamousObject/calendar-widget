'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, Edit, Trash2, FileText, ExternalLink, Check, X, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Form {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!newFormName.trim()) {
      toast.error('Form name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFormName,
          description: newFormDescription,
          fields: [],
          settings: {
            successMessage: 'Thank you for your submission!',
            emailNotifications: true,
          },
          active: false, // Start as inactive until fields are added
        }),
      });

      if (response.ok) {
        const { form } = await response.json();
        toast.success('Form created successfully');
        setShowCreateDialog(false);
        setNewFormName('');
        setNewFormDescription('');
        router.push(`/dashboard/forms/${form.id}/edit`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create form');
      }
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteForm = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all submissions.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Form deleted successfully');
        fetchForms();
      } else {
        toast.error('Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-tight">Contact Forms</h1>
              </div>
              <p className="text-lg text-foreground-secondary font-light">
                Create and manage custom contact forms for your website
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">No forms yet</h3>
              <p className="text-foreground-secondary mb-6 text-center max-w-md">
                Create your first contact form to start collecting submissions from your website
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form, index) => (
              <Card
                key={form.id}
                className="group border-border shadow-md hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-display text-xl flex items-center gap-2 mb-2">
                        {form.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={form.active ? 'default' : 'secondary'} className="font-normal">
                          {form.active ? (
                            <><Check className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><X className="h-3 w-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                      </div>
                      {form.description && (
                        <CardDescription className="mt-3 line-clamp-2">
                          {form.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-foreground-secondary flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Submissions
                      </span>
                      <span className="font-display text-lg font-bold">{form._count.submissions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-foreground-tertiary px-1">
                      <span>Created</span>
                      <span>{format(new Date(form.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:border-primary hover:text-primary transition-all duration-200"
                        onClick={() => router.push(`/dashboard/forms/${form.id}/submissions`)}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:border-accent hover:text-accent transition-all duration-200"
                        onClick={() => router.push(`/dashboard/forms/${form.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteForm(form.id, form.name)}
                        className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Form Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Create New Form</DialogTitle>
              <DialogDescription className="text-base">
                Give your form a name and description. You'll add fields in the next step.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Form Name *</Label>
                <Input
                  id="name"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="e.g., Contact Us, Quote Request"
                  className="border-border focus:border-primary transition-colors duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  placeholder="What is this form for?"
                  rows={3}
                  className="border-border focus:border-primary transition-colors duration-200"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateForm}
                disabled={!newFormName.trim() || creating}
                className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                {creating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create & Edit Fields
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
