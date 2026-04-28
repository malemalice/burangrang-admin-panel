import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Pencil } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';

import manHourService from '../services/manHourService';
import { ManHour, GROUP_LABELS, MONTH_LABELS } from '../types/man-hour.types';

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-sm">{value ?? '—'}</div>
  </div>
);

export default function ViewManHourPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manHour, setManHour] = useState<ManHour | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManHour = async () => {
      if (!id) {
        navigate('/man-hours');
        return;
      }

      try {
        const data = await manHourService.getManHour(id);
        setManHour(data);
      } catch (error) {
        console.error('Failed to fetch man hour:', error);
        toast.error('Failed to load man hour');
        navigate('/man-hours');
      } finally {
        setIsLoading(false);
      }
    };

    fetchManHour();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!manHour) {
    return null;
  }

  const creatorName = manHour.creator
    ? `${manHour.creator.firstName} ${manHour.creator.lastName}`
    : '—';

  return (
    <>
      <PageHeader
        title="Man hour details"
        subtitle={`${manHour.name} · ${MONTH_LABELS[manHour.month]} ${manHour.year}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/man-hours')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Button>
            <PermissionGuard permission="man-hour:update">
              <Button onClick={() => navigate(`/man-hours/${manHour.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Name / Class" value={<span className="font-medium">{manHour.name}</span>} />
              <Field
                label="Group"
                value={
                  <Badge
                    variant="outline"
                    className={
                      manHour.group === 'STUDENT'
                        ? 'bg-blue-100 text-blue-800 border-0'
                        : 'bg-purple-100 text-purple-800 border-0'
                    }
                  >
                    {GROUP_LABELS[manHour.group]}
                  </Badge>
                }
              />
              <Field label="Period" value={`${MONTH_LABELS[manHour.month]} ${manHour.year}`} />
              <Field
                label="Status"
                value={
                  <Badge
                    variant="outline"
                    className={
                      manHour.isActive
                        ? 'bg-green-100 text-green-800 border-0'
                        : 'bg-gray-100 text-gray-800 border-0'
                    }
                  >
                    {manHour.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Figures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Quantity (people)" value={manHour.qty.toLocaleString()} />
              <Field label="Hours per day" value={String(manHour.manHourPerDay)} />
              <Field
                label="Total working days (capacity)"
                value={manHour.totalWorkingDays.toLocaleString()}
              />
              <Field label="Lost hours" value={manHour.lostHour.toLocaleString()} />
              <Field
                label="Total man hours"
                value={<span className="font-medium">{manHour.total.toLocaleString()}</span>}
              />
            </div>
          </CardContent>
        </Card>

        {manHour.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{manHour.notes}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Created by" value={creatorName} />
              <Field
                label="Created at"
                value={format(new Date(manHour.createdAt), 'dd MMM yyyy HH:mm')}
              />
              <Field
                label="Updated at"
                value={format(new Date(manHour.updatedAt), 'dd MMM yyyy HH:mm')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
