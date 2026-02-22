import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import accessLogService from '../services/accessLogService';
import type { AccessLog } from '../types/access-log.types';
import { format } from 'date-fns';

const AccessLogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [log, setLog] = useState<AccessLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    accessLogService
      .getAccessLogById(id)
      .then((data) => {
        if (!cancelled) setLog(data);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to fetch access log:', error);
          toast.error('Failed to load access log');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const formatUser = (log: AccessLog) => {
    if (log.user) {
      const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ');
      return name || log.user.email || log.userId || '—';
    }
    return log.userId || '—';
  };

  return (
    <PermissionGuard
      permission="access-log:read"
      fallback={
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          You don&apos;t have access to view this access log.
        </div>
      }
    >
      <PageHeader
        title="Access Log Detail"
        subtitle={log ? `${log.method} ${log.endpoint}` : undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      {isLoading && (
        <div className="text-muted-foreground py-8 text-center">Loading…</div>
      )}

      {!isLoading && !log && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          Access log not found.
        </div>
      )}

      {!isLoading && log && (
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <p className="font-mono font-medium">{log.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                  <p className="font-mono text-sm break-all">{log.endpoint}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p>{log.statusCode ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time</p>
                  <p>
                    {log.createdAt
                      ? format(new Date(log.createdAt), 'PPpp')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Execution (ms)</p>
                  <p>{log.executionTime ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP</p>
                  <p className="font-mono text-sm">{log.ipAddress ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p>{formatUser(log)}</p>
                  {log.user?.email && (
                    <p className="text-muted-foreground text-sm">{log.user.email}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">User-Agent</p>
                  <p className="text-sm break-all text-muted-foreground">
                    {log.userAgent ?? '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payload</CardTitle>
              <p className="text-sm text-muted-foreground">
                Request body, query, and route params
              </p>
            </CardHeader>
            <CardContent>
              {log.payload && Object.keys(log.payload).length > 0 ? (
                <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[400px] font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">No payload recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PermissionGuard>
  );
};

export default AccessLogDetailPage;
