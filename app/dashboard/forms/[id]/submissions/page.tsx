'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Mail } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface FormSubmission {
  id: string;
  data: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  createdAt: string;
}

interface Form {
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    id: string;
    label: string;
    fieldType: string;
  }>;
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    fetchFormAndSubmissions();
  }, []);

  const fetchFormAndSubmissions = async () => {
    try {
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${formId}`);
      if (formResponse.ok) {
        const formData = await formResponse.json();
        setForm(formData.form);
      }

      // Fetch submissions
      const submissionsResponse = await fetch(
        `/api/forms/${formId}/submissions`
      );
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (fieldId: string) => {
    if (!form) return fieldId;
    const field = form.fields.find((f) => f.id === fieldId);
    return field?.label || fieldId;
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/forms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {form?.name || 'Form'} Submissions
            </h1>
            <p className="text-muted-foreground mt-1">
              {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Submissions will appear here when visitors fill out your form
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        Submission from{' '}
                        {format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {submission.ipAddress && (
                          <span>IP: {submission.ipAddress}</span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            submission.status === 'new'
                              ? 'bg-blue-100 text-blue-700'
                              : submission.status === 'read'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(submission.data).slice(0, 4).map(([fieldId, value]) => (
                      <div key={fieldId}>
                        <p className="text-sm font-medium text-muted-foreground">
                          {getFieldLabel(fieldId)}
                        </p>
                        <p className="text-sm mt-1">
                          {typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {Object.keys(submission.data).length > 4 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      +{Object.keys(submission.data).length - 4} more field
                      {Object.keys(submission.data).length - 4 !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Submission Detail Dialog */}
        <Dialog
          open={!!selectedSubmission}
          onOpenChange={() => setSelectedSubmission(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>
                Submitted on{' '}
                {selectedSubmission &&
                  format(
                    new Date(selectedSubmission.createdAt),
                    'MMMM d, yyyy h:mm a'
                  )}
              </DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4 py-4">
                {Object.entries(selectedSubmission.data).map(([fieldId, value]) => (
                  <div key={fieldId} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {getFieldLabel(fieldId)}
                    </p>
                    <p className="text-sm">
                      {typeof value === 'boolean'
                        ? value
                          ? 'Yes'
                          : 'No'
                        : String(value)}
                    </p>
                  </div>
                ))}

                {selectedSubmission.ipAddress && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">
                      Metadata
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs">
                        <span className="font-medium">IP Address:</span>{' '}
                        {selectedSubmission.ipAddress}
                      </p>
                      {selectedSubmission.userAgent && (
                        <p className="text-xs break-all">
                          <span className="font-medium">User Agent:</span>{' '}
                          {selectedSubmission.userAgent}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
