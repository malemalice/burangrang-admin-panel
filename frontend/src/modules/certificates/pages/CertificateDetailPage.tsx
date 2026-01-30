import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Calendar, Award, Building, User, FileText, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/core/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/core/components/ui/select';
import { DateTimePicker } from '@/core/components/ui/datetime-picker';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import PageHeader from '@/core/components/ui/PageHeader';
import { useCertificate } from '../hooks/useCertificates';
import { useCertificateRenewals } from '../hooks/useCertificates';
import { useCertificateReminders } from '../hooks/useCertificates';
import { CertificateRenewal } from '../types/certificate.types';

const CertificateDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { certificate, isLoading } = useCertificate(id || null);
    const { renewals, isLoading: isLoadingRenewals, createRenewal, updateRenewal } = useCertificateRenewals(id || null);
    const { reminders, isLoading: isLoadingReminders } = useCertificateReminders(id || null);

    const [isRenewalOpen, setIsRenewalOpen] = useState(false);
    const [renewalNotes, setRenewalNotes] = useState('');
    const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);

    // Process Renewal State
    const [isProcessRenewalOpen, setIsProcessRenewalOpen] = useState(false);
    const [selectedRenewal, setSelectedRenewal] = useState<CertificateRenewal | null>(null);
    const [processRenewalData, setProcessRenewalData] = useState({
        status: 'IN_PROGRESS' as 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED',
        newValidityDate: '',
        notes: '',
    });
    const [isProcessingRenewal, setIsProcessingRenewal] = useState(false);

    const handleCreateRenewal = async () => {
        if (!id) return;
        try {
            setIsSubmittingRenewal(true);
            await createRenewal(id, { notes: renewalNotes });
            setIsRenewalOpen(false);
            setRenewalNotes('');
        } catch (error) {
            console.error('Failed to create renewal:', error);
        } finally {
            setIsSubmittingRenewal(false);
        }
    };

    const handleProcessRenewal = async () => {
        if (!selectedRenewal || !updateRenewal) return;
        try {
            setIsProcessingRenewal(true);
            await updateRenewal(selectedRenewal.id, {
                status: processRenewalData.status,
                newValidityDate: processRenewalData.newValidityDate || undefined,
                notes: processRenewalData.notes || undefined,
            });
            setIsProcessRenewalOpen(false);
            setSelectedRenewal(null);
            setProcessRenewalData({ status: 'IN_PROGRESS', newValidityDate: '', notes: '' });
        } catch (error) {
            console.error('Failed to process renewal:', error);
        } finally {
            setIsProcessingRenewal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading certificate...</p>
                </div>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Certificate not found</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: 'default' | 'destructive' | 'outline'; label: string }> = {
            PENDING: { variant: 'outline', label: 'Pending' },
            REQUESTED: { variant: 'outline', label: 'Requested' },
            IN_PROGRESS: { variant: 'default', label: 'In Progress' },
            COMPLETED: { variant: 'default', label: 'Completed' },
            REJECTED: { variant: 'destructive', label: 'Rejected' },
            EXPIRED: { variant: 'destructive', label: 'Expired' },
        };

        const config = statusConfig[status] || { variant: 'outline', label: status };
        return (
            <Badge variant={config.variant}>{config.label}</Badge>
        );
    };

    return (
        <>
            <PageHeader
                title={certificate.certificateName}
                subtitle={`Certificate Number: ${certificate.certificateNumber}`}
                actions={
                    <Button onClick={() => navigate(`/certificates/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Certificate
                    </Button>
                }
            />

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="renewals">Renewals ({renewals.length})</TabsTrigger>
                    <TabsTrigger value="reminders">Reminders ({reminders.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Certificate Number</p>
                                    <p className="font-medium">{certificate.certificateNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Certificate Name</p>
                                    <p className="font-medium">{certificate.certificateName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium">{certificate.category?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Certificate Type</p>
                                    <p className="font-medium">{certificate.certificateType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Issuer</p>
                                    <p className="font-medium">{certificate.issuerName}</p>
                                </div>
                                {certificate.documentUrl && (
                                    <div>
                                        <p className="text-sm text-gray-500">Document</p>
                                        <a
                                            href={
                                                certificate.documentUrl.startsWith('http')
                                                    ? certificate.documentUrl
                                                    : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/public/${certificate.documentUrl}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Document
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Dates & Validity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Issued Date</p>
                                    <p className="font-medium">{formatDate(certificate.issuedDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Validity Date</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{formatDate(certificate.validityDate)}</p>
                                        {certificate.isExpired && (
                                            <Badge variant="destructive">Expired</Badge>
                                        )}
                                        {certificate.isExpiringSoon && !certificate.isExpired && (
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Expiring Soon
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Reminder Days</p>
                                    <p className="font-medium">{certificate.reminderDays} days</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge
                                        variant="outline"
                                        className={`${certificate.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            } border-0`}
                                    >
                                        {certificate.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {certificate.personnelName ? (
                                        <User className="h-5 w-5" />
                                    ) : (
                                        <Building className="h-5 w-5" />
                                    )}
                                    {certificate.personnelName ? 'Personnel' : 'Equipment'} Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {certificate.personnelName ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-500">Personnel Name</p>
                                            <p className="font-medium">{certificate.personnelName}</p>
                                        </div>
                                    </>
                                ) : certificate.equipmentName ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-500">Equipment Name</p>
                                            <p className="font-medium">{certificate.equipmentName}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-400">N/A</p>
                                )}
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="font-medium">{certificate.department || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {certificate.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{certificate.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="renewals" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Renewal History</CardTitle>
                            <Button onClick={() => setIsRenewalOpen(true)} size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Request Renewal
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingRenewals ? (
                                <p className="text-gray-500">Loading renewals...</p>
                            ) : renewals.length === 0 ? (
                                <p className="text-gray-500">No renewal requests found</p>
                            ) : (
                                <div className="space-y-4">
                                    {renewals.map((renewal) => (
                                        <div
                                            key={renewal.id}
                                            className="border rounded-lg p-4 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        Request Date: {formatDate(renewal.requestDate)}
                                                    </p>
                                                    {renewal.requester && (
                                                        <p className="text-sm text-gray-500">
                                                            Requested by: {renewal.requester}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(renewal.status)}
                                                    {(renewal.status === 'PENDING' ||
                                                        renewal.status === 'REQUESTED' ||
                                                        renewal.status === 'IN_PROGRESS') && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedRenewal(renewal);
                                                                    setProcessRenewalData((prev) => ({
                                                                        ...prev,
                                                                        status: renewal.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS',
                                                                    }));
                                                                    setIsProcessRenewalOpen(true);
                                                                }}
                                                            >
                                                                Process
                                                            </Button>
                                                        )}
                                                </div>
                                            </div>
                                            {renewal.processedDate && (
                                                <p className="text-sm text-gray-500">
                                                    Processed: {formatDate(renewal.processedDate)}
                                                </p>
                                            )}
                                            {renewal.newValidityDate && (
                                                <p className="text-sm text-gray-500">
                                                    New Validity Date: {formatDate(renewal.newValidityDate)}
                                                </p>
                                            )}
                                            {renewal.notes && (
                                                <p className="text-sm text-gray-500">Notes: {renewal.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reminders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reminder History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingReminders ? (
                                <p className="text-gray-500">Loading reminders...</p>
                            ) : reminders.length === 0 ? (
                                <p className="text-gray-500">No reminders found</p>
                            ) : (
                                <div className="space-y-4">
                                    {reminders.map((reminder) => (
                                        <div
                                            key={reminder.id}
                                            className="border rounded-lg p-4 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        Reminder Date: {formatDate(reminder.reminderDate)}
                                                    </p>
                                                    {reminder.recipient && (
                                                        <p className="text-sm text-gray-500">
                                                            Recipient: {reminder.recipient}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant={reminder.isSent ? 'default' : 'outline'}>
                                                    {reminder.isSent ? 'Sent' : 'Pending'}
                                                </Badge>
                                            </div>
                                            {reminder.sentAt && (
                                                <p className="text-sm text-gray-500">
                                                    Sent at: {formatDate(reminder.sentAt)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isRenewalOpen} onOpenChange={setIsRenewalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Certificate Renewal</DialogTitle>
                        <DialogDescription>
                            Create a new renewal request for this certificate.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Enter renewal notes or instructions..."
                                value={renewalNotes}
                                onChange={(e) => setRenewalNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRenewalOpen(false)}
                            disabled={isSubmittingRenewal}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateRenewal}
                            disabled={isSubmittingRenewal}
                        >
                            {isSubmittingRenewal ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isProcessRenewalOpen} onOpenChange={setIsProcessRenewalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Renewal Request</DialogTitle>
                        <DialogDescription>
                            Update the status and provide new validity date if approved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={processRenewalData.status}
                                onValueChange={(value) =>
                                    setProcessRenewalData((prev) => ({ ...prev, status: value as any }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">Completed (Approved)</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {processRenewalData.status === 'COMPLETED' && (
                            <div className="space-y-2">
                                <Label htmlFor="newValidityDate">New Validity Date *</Label>
                                <DateTimePicker
                                    mode="date"
                                    value={processRenewalData.newValidityDate}
                                    onChange={(value) =>
                                        setProcessRenewalData((prev) => ({ ...prev, newValidityDate: value as string }))
                                    }
                                    placeholder="Select new validity date"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="processNotes">Notes</Label>
                            <Textarea
                                id="processNotes"
                                placeholder="Enter processing notes..."
                                value={processRenewalData.notes}
                                onChange={(e) =>
                                    setProcessRenewalData((prev) => ({ ...prev, notes: e.target.value }))
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsProcessRenewalOpen(false)}
                            disabled={isProcessingRenewal}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleProcessRenewal}
                            disabled={
                                isProcessingRenewal ||
                                (processRenewalData.status === 'COMPLETED' && !processRenewalData.newValidityDate)
                            }
                        >
                            {isProcessingRenewal ? 'Processing...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CertificateDetailPage;

