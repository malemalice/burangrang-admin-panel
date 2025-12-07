import { useParams } from 'react-router-dom';
import { useEmailTemplate } from '../hooks/useEmailTemplates';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

const EmailTemplateDetailPage = () => {
  const { templateId } = useParams();
  const { template, isLoading } = useEmailTemplate(templateId || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <>
      <PageHeader title={template.name} subtitle={template.code} />
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Template Info</CardTitle>
              <Badge
                variant="outline"
                className={`${
                  template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                } border-0`}
              >
                {template.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Subject</div>
              <div className="font-medium">{template.subject}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Body</div>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md">
{template.body}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default EmailTemplateDetailPage;


