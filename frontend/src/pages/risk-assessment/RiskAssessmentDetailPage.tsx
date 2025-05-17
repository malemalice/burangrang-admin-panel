import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileEdit, ArrowLeft, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { RiskAssessment } from '@/lib/types';
import riskAssessmentService from '@/services/riskAssessmentService';

const RiskAssessmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (!id) return;
        const data = await riskAssessmentService.getById(id);
        setAssessment(data);
      } catch (error) {
        toast.error('Failed to fetch risk assessment');
        navigate('/risk-assessment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate]);

  // Get risk badge color based on rating
  const getRiskBadge = (rating: string) => {
    const colorMap: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800 border-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-800',
      CRITICAL: 'bg-red-100 text-red-800 border-red-800',
      EXTREME: 'bg-purple-100 text-purple-800 border-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colorMap[rating] || 'bg-gray-100 text-gray-800 border-gray-800'}`}>
        {rating}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      DRAFT: { label: 'Draft', variant: 'outline' },
      IN_PROGRESS: { label: 'In Progress', variant: 'secondary' },
      COMPLETED: { label: 'Completed', variant: 'default' },
      REVIEWED: { label: 'Reviewed', variant: 'default' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/risk-assessment')} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Button>
        <Button onClick={() => navigate(`/risk-assessment/${id}/edit`)}>
          <FileEdit className="h-4 w-4 mr-2" />
          Edit Assessment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Risk Assessment: {assessment.code}</CardTitle>
              <CardDescription>
                Created on {format(new Date(assessment.createdAt), 'dd MMM yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(assessment.status)}
              <Badge variant={assessment.isActive ? 'default' : 'outline'}>
                {assessment.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Department</p>
              <p>{assessment.department?.name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Assessment Date</p>
              <p>
                {assessment.assessmentDate 
                  ? format(new Date(assessment.assessmentDate), 'dd MMM yyyy') 
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Created By</p>
              <p>{assessment.createdBy || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Last Updated</p>
              <p>{format(new Date(assessment.updatedAt), 'dd MMM yyyy')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Assignee</p>
              <p>{assessment.assignee ? `${assessment.assignee.firstName} ${assessment.assignee.lastName}` : 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {assessment.actionPlan && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-4">Action Plan</h3>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: assessment.actionPlan }} />
              </div>
              <Separator />
            </>
          )}

          <div>
            <h3 className="text-lg font-medium mb-4">Risk Assessment Items</h3>
            
            {assessment.items.length === 0 ? (
              <div className="flex items-center justify-center p-6 border rounded-md bg-muted/20">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                <p>No risk items available for this assessment.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">HSE Category</TableHead>
                      <TableHead className="w-[250px]">Threat</TableHead>
                      <TableHead className="w-[100px]">Likelihood</TableHead>
                      <TableHead className="w-[100px]">Consequence</TableHead>
                      <TableHead className="w-[120px]">Risk Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessment.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.mHseCategory 
                            ? `${item.mHseCategory.code} - ${item.mHseCategory.name}` 
                            : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {item.mThreat 
                            ? `${item.mThreat.code} - ${item.mThreat.name}` 
                            : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-center">{item.likelihoodLevel}</TableCell>
                        <TableCell className="text-center">{item.consequenceLevel}</TableCell>
                        <TableCell>{getRiskBadge(item.riskMatrixRating)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/risk-assessment')}
          >
            Back to List
          </Button>
          <Button 
            onClick={() => navigate(`/risk-assessment/${id}/edit`)}
          >
            Edit Assessment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RiskAssessmentDetailPage; 