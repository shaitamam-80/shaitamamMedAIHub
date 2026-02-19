'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { createProject } from '@/lib/api/backend-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const project = await createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        review_type: 'systematic_intervention',
        framework: 'PICO',
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="size-4 me-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create New Project</CardTitle>
          <p className="text-sm text-muted-foreground">
            Start a new systematic review project. The review type and framework
            will be determined during the research question stage.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Exercise Interventions for Depression in Elderly"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your research topic and goals"
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" asChild>
                <Link href="/">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 me-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 me-1" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
