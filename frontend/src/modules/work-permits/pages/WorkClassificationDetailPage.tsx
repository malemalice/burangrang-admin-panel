import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, ClipboardList, Loader2, FileText, Paperclip } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';
import { usePermissions } from '@/core/hooks/usePermissions';

const WorkClassificationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [row, setRow] = useState<WorkClassification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await workClassificationService.getWorkClassificationById(id);
        setRow(data);
      } catch (error: unknown) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load work classification';
        toast.error(errorMessage);
        navigate('/master/work-classifications');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-xl font-semibold">Not found</h2>
        <Button onClick={() => navigate('/master/work-classifications')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  const canEdit = hasPermission('work-permit:update');

  return (
    <>
      <PageHeader
        title={row.name}
        subtitle={`Code: ${row.code}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/master/work-classifications')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canEdit && (
              <Button
                onClick={() => navigate(`/master/work-classifications/${row.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant="outline"
                className={
                  row.isActive
                    ? 'border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : 'border-0 bg-muted'
                }
              >
                {row.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {row.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{row.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div>Created: {formatDateTime(row.createdAt)}</div>
              <div>Updated: {formatDateTime(row.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Safety guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {row.safetyGuideline ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full [&_td]:border [&_th]:border"
                // eslint-disable-next-line react/no-danger -- trusted admin-authored HTML from TipTap
                dangerouslySetInnerHTML={{ __html: row.safetyGuideline }}
              />
            ) : (
              <p className="text-muted-foreground">No safety guidelines defined.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Paperclip className="h-5 w-5" />
              Attached documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {row.attachments && row.attachments.length > 0 ? (
              <ul className="space-y-3">
                {row.attachments
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((att) => (
                    <li key={att.id} className="rounded-lg border p-3">
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {att.fileName}
                      </a>
                      {att.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{att.description}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No documents attached.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WorkClassificationDetailPage;
