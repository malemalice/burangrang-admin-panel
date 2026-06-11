import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2, FileText, Users, ShieldCheck, AlertTriangle, Eye, Package, Image, Paperclip, ClipboardCheck, Check, X, FileDown, Loader2 } from 'lucide-react';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import IncidentPDFTemplate from '../components/IncidentPDFTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import incidentsService from '../services/incidentsService';
import investigationReportsService from '@/modules/investigation-reports/services/investigationReportsService';
import type { InvestigationReport } from '@/modules/investigation-reports/types/investigation-report.types';
import { 
  Incident, 
  StopActivityEnum, 
  TreatmentEnum, 
  AbsenceEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum
} from '../types/incident.types';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { approvalService, type ApprovalStatusHistory } from '@/modules/master-data';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';

const IncidentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [investigationReport, setInvestigationReport] = useState<InvestigationReport | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const pdfTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await incidentsService.getById(id);
        setIncident(data);
      } catch (error) {
        console.error('Failed to fetch incident:', error);
        toast.error('Failed to load incident');
        navigate('/incidents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncident();
  }, [id, navigate]);

  // Look up linked investigation report (if any)
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    investigationReportsService
      .getByIncidentId(id)
      .then((report) => {
        if (!cancelled) setInvestigationReport(report);
      })
      .catch(() => {
        if (!cancelled) setInvestigationReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch approval status/history
  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!id) return;

      setIsLoadingHistory(true);
      try {
        const approvalStatus = await approvalService.checkApprovalStatus(id, APPROVAL_ENTITIES.INCIDENT);
        // Handle backend error response (backend returns { error: true, message: string } on errors)
        if (approvalStatus && !(approvalStatus as any).error) {
          setApprovalHistory(approvalStatus);
        } else {
          // Backend returned an error response, but still set empty history
          setApprovalHistory({
            history: [],
            nextApprover: null,
            allApprovalLines: [],
            currentStatus: 'UNKNOWN',
          });
        }
      } catch (error) {
        console.error('Failed to fetch approval status:', error);
        // Set empty history instead of null, so component can still render
        setApprovalHistory({
          history: [],
          nextApprover: null,
          allApprovalLines: [],
          currentStatus: 'UNKNOWN',
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchApprovalStatus();
  }, [id]);

  const handleExportPDF = async () => {
    if (!incident) return;
    try {
      setIsExportingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await generateTableAwarePdf(
        pdfTargetRef,
        buildPdfOptions({ filename: `${incident.code}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf` }),
      );
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await incidentsService.delete(id);
      toast.success('Incident deleted successfully');
      navigate('/incidents');
    } catch (error) {
      console.error('Failed to delete incident:', error);
      toast.error('Failed to delete incident');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: GeneralStatusEnum) => {
    const statusConfig = {
      [GeneralStatusEnum.DRAFT]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Draft' },
      [GeneralStatusEnum.OPEN]: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Open' },
      [GeneralStatusEnum.SCHEDULED]: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Scheduled' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Waiting Verification' },
      [GeneralStatusEnum.DONE]: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Done' },
      [GeneralStatusEnum.REJECTED]: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rejected' },
      [GeneralStatusEnum.CLOSE]: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: 'Close' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading incident report details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Incident report not found</p>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incident Reports
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Incident Report: ${incident.code}`}
        subtitle="View and manage incident report information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isLoading || isDeleting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incident Reports
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExportingPDF || isLoading}
            >
              {isExportingPDF ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {isExportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
            {investigationReport ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/investigation-reports/${investigationReport.id}`)}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                View Investigation Report
              </Button>
            ) : (
              incident.needFurtherInvestigation && (
                <Button
                  onClick={() => navigate(`/investigation-reports/new?incidentId=${id}`)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Create Investigation Report
                </Button>
              )
            )}
            {(incident.status !== GeneralStatusEnum.WAITING_APPROVAL && incident.status !== GeneralStatusEnum.CLOSE) && (
              <>
                <Button
                  onClick={() => navigate(`/incidents/${id}/edit`)}
                  disabled={isLoading || isDeleting}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Incident
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isLoading || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Incident
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="container mx-auto py-6 space-y-8">
        {/* Basic Information and Approval Timeline */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Code</h3>
                  <p className="mt-1 text-sm">{incident.code}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                  <p className="mt-1 text-sm">{incident.subject}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Incident Date</h3>
                  <p className="mt-1 text-sm">{format(new Date(incident.incidentDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <p className="mt-1 text-sm">{incident.room?.name || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Area</h3>
                  <p className="mt-1 text-sm">{incident.area?.name || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type of Hazard</h3>
                  <p className="mt-1 text-sm">{incident.riskCategory?.name || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                  <p className="mt-1 text-sm">{incident.incidentType.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Classification</h3>
                  <p className="mt-1 text-sm">{incident.incidentClassification}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                  <p className="mt-1 text-sm">{incident.priority}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">{getStatusBadge(incident.status)}</div>
                </div>
              </div>
              
              {/* Approval Timeline */}
              <div className="lg:border-l lg:pl-6 flex flex-col">
                <ApprovalTimelineCard
                  approvalHistory={approvalHistory}
                  isLoading={isLoadingHistory}
                  assessmentStatus={incident.status === GeneralStatusEnum.DONE ? 'DONE' : incident.status}
                  entityDepartmentName={incident.assignedDepartment?.name}
                  entityJobPositionName="Department Head"
                />
              </div>
            </div>
            {incident.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* People Involved */}
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              People Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {incident.requester && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Requester</h3>
                  <p className="mt-1 text-sm">
                    {incident.requester.name ??
                      ([incident.requester.firstName, incident.requester.lastName].filter(Boolean).join(' ').trim() || '-')}
                  </p>
                </div>
              )}
              {incident.reporter && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reporter</h3>
                  <p className="mt-1 text-sm">
                    {incident.reporter.name ??
                      ([incident.reporter.firstName, incident.reporter.lastName].filter(Boolean).join(' ').trim() || '-')}
                  </p>
                </div>
              )}
              {incident.technician && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Technician</h3>
                  <p className="mt-1 text-sm">
                    {incident.technician.name ??
                      ([incident.technician.firstName, incident.technician.lastName].filter(Boolean).join(' ').trim() || '-')}
                  </p>
                </div>
              )}
              {incident.assignedDepartment && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Assigned Department</h3>
                  <p className="mt-1 text-sm">{incident.assignedDepartment.name}</p>
                </div>
              )}
              {incident.assignee && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Assignee</h3>
                  <p className="mt-1 text-sm">
                    {incident.assignee.name ??
                      ([incident.assignee.firstName, incident.assignee.lastName].filter(Boolean).join(' ').trim() || '-')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Injured Persons */}
        {incident.injuredPersons && incident.injuredPersons.length > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Injured Persons
                </CardTitle>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {incident.injuredPersons.length} {incident.injuredPersons.length === 1 ? 'person' : 'people'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.injuredPersons.map((person, index) => (
                <Card key={person.id} className="bg-white dark:bg-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Injured Person {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {person.injuredPersonName && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                          <p className="mt-1 text-sm">{person.injuredPersonName}</p>
                        </div>
                      )}
                      {person.gender && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                          <p className="mt-1 text-sm">{person.gender}</p>
                        </div>
                      )}
                      {person.department && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                          <p className="mt-1 text-sm">{person.department.name}</p>
                        </div>
                      )}
                      {person.levelOfInjury !== LevelOfInjuryEnum.NOT_SPECIFIED && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Level of Injury</h3>
                          <p className="mt-1 text-sm">{person.levelOfInjury.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                      {person.injuredBodyPart !== InjuredBodyPartEnum.NOT_SPECIFIED && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Injured Body Part</h3>
                          <p className="mt-1 text-sm">{person.injuredBodyPart.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                      {person.typeOfInjury !== TypeOfInjuryEnum.NOT_SPECIFIED && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Type of Injury</h3>
                          <p className="mt-1 text-sm">{person.typeOfInjury.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                      {person.mechanismOfInjury !== MechanismOfInjuryEnum.NOT_SPECIFIED && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Mechanism of Injury</h3>
                          <p className="mt-1 text-sm">{person.mechanismOfInjury.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Third Parties */}
        {incident.thirdParties && incident.thirdParties.length > 0 && (
          <Card className="border-l-4 border-l-violet-500 bg-violet-50/30 dark:bg-violet-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Third Parties
                </CardTitle>
                <Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                  {incident.thirdParties.length} {incident.thirdParties.length === 1 ? 'person' : 'persons'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.thirdParties.map((tp, index) => (
                <Card key={tp.id} className="bg-white dark:bg-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Third Party {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                        <p className="mt-1 text-sm">{tp.name}</p>
                      </div>
                      {tp.gender && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                          <p className="mt-1 text-sm">{tp.gender}</p>
                        </div>
                      )}
                      {tp.company && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                          <p className="mt-1 text-sm">{tp.company}</p>
                        </div>
                      )}
                      {tp.position && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Position</h3>
                          <p className="mt-1 text-sm">{tp.position}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Witnesses */}
        {incident.witnesses && incident.witnesses.length > 0 && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Witnesses
                </CardTitle>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  {incident.witnesses.length} {incident.witnesses.length === 1 ? 'witness' : 'witnesses'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.witnesses.map((witness, index) => (
                <Card key={witness.id} className="bg-white dark:bg-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Witness {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {witness.witnessName && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                          <p className="mt-1 text-sm">{witness.witnessName}</p>
                        </div>
                      )}
                      {witness.gender && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                          <p className="mt-1 text-sm">{witness.gender}</p>
                        </div>
                      )}
                      {witness.department && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                          <p className="mt-1 text-sm">{witness.department.name}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Assets */}
        {incident.assets && incident.assets.length > 0 && (
          <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Assets
                </CardTitle>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {incident.assets.length} {incident.assets.length === 1 ? 'asset' : 'assets'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.assets.map((asset, index) => (
                <Card key={asset.id} className="bg-white dark:bg-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Asset {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Asset Name</h3>
                        <p className="mt-1 text-sm">{asset.assetName}</p>
                      </div>
                      {asset.assetCode && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Asset Code</h3>
                          <p className="mt-1 text-sm">{asset.assetCode}</p>
                        </div>
                      )}
                      {asset.brand && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Brand</h3>
                          <p className="mt-1 text-sm">{asset.brand}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {incident.images && incident.images.length > 0 && (
          <Card className="border-l-4 border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Images
                </CardTitle>
                <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                  {incident.images.length} {incident.images.length === 1 ? 'image' : 'images'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.images.map((img, index) => (
                <Card key={img.id} className="bg-white dark:bg-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Image {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Image URL</h3>
                      <a href={img.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                        {img.imageUrl}
                      </a>
                    </div>
                    {img.caption && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Caption</h3>
                        <p className="text-sm">{img.caption}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {incident.attachments && incident.attachments.length > 0 && (
          <Card className="border-l-4 border-l-slate-500 bg-slate-50/30 dark:bg-slate-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Paperclip className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  Attachments
                </CardTitle>
                <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                  {incident.attachments.length} {incident.attachments.length === 1 ? 'attachment' : 'attachments'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incident.attachments.map((attachment, index) => (
                <Card key={attachment.id} className="bg-white dark:bg-gray-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Attachment {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Attachment URL</h3>
                      <a href={attachment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                        {attachment.attachmentUrl}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Control Measures & Outcomes */}
        {(incident.controlMeasure || incident.expectedOutcome || incident.resolution ||
          incident.stopActivityDescription || incident.stopLocally || incident.stopWholeSchool ||
          incident.treatmentDescription || incident.dueDate ||
          incident.needToStopActivity !== StopActivityEnum.NOT_SPECIFIED || incident.treatment !== TreatmentEnum.NOT_SPECIFIED || 
          incident.absence !== AbsenceEnum.NOT_SPECIFIED) && (
          <Card className="border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                Control Measures & Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {incident.dueDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                    <p className="mt-1 text-sm">{format(new Date(incident.dueDate), 'dd MMM yyyy')}</p>
                  </div>
                )}
                {incident.needToStopActivity !== StopActivityEnum.NOT_SPECIFIED && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Need to Stop Activity</h3>
                    <p className="mt-1 text-sm">{incident.needToStopActivity.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {incident.treatment !== TreatmentEnum.NOT_SPECIFIED && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Treatment</h3>
                    <p className="mt-1 text-sm">{incident.treatment.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {incident.absence !== AbsenceEnum.NOT_SPECIFIED && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Absence</h3>
                    <p className="mt-1 text-sm">{incident.absence.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
              {incident.controlMeasure && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Action Taken Following The Incident</h3>
                  <p className="text-sm whitespace-pre-wrap">{incident.controlMeasure}</p>
                </div>
              )}
              {incident.expectedOutcome && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Expected Outcome</h3>
                  <p className="text-sm whitespace-pre-wrap">{incident.expectedOutcome}</p>
                </div>
              )}
              {incident.needToStopActivity === StopActivityEnum.YES && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">If Yes (Jika Ya)</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex items-start gap-2 text-sm">
                      {incident.stopLocally ? (
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mt-0.5" />
                      )}
                      <span>
                        Stop activity locally related to the accident/incident/nearmiss
                        <span className="block text-xs text-muted-foreground">
                          Hentikan aktivitas terkait kecelakaan/insiden/nearmiss
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      {incident.stopWholeSchool ? (
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mt-0.5" />
                      )}
                      <span>
                        Stop the whole school activities
                        <span className="block text-xs text-muted-foreground">
                          Hentikan seluruh kegiatan sekolah
                        </span>
                      </span>
                    </div>
                  </div>
                  {incident.stopActivityDescription && !incident.stopLocally && !incident.stopWholeSchool && (
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {incident.stopActivityDescription}
                    </p>
                  )}
                </div>
              )}
              {incident.treatmentDescription && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Treatment Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{incident.treatmentDescription}</p>
                </div>
              )}
              {incident.resolution && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Resolution</h3>
                  <p className="text-sm whitespace-pre-wrap">{incident.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="border-l-4 border-l-gray-500 bg-gray-50/30 dark:bg-gray-950/10">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p className="mt-1 text-sm">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="mt-1 text-sm">{incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
                <p className="mt-1 text-sm">{incident.source}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <div className="mt-1">{incident.isActive ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge> : <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Inactive</Badge>}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Incident Report"
        description={`Are you sure you want to delete incident report "${incident.code}"? This action will mark it as inactive.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
      />

      {/* Hidden PDF render target */}
      <div
        ref={pdfTargetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        <IncidentPDFTemplate incident={incident} />
      </div>
    </>
  );
};

export default IncidentDetailPage;
