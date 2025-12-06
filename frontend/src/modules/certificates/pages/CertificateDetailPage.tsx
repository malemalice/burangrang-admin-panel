import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Calendar, Award, Building, User, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import PageHeader from '@/core/components/ui/PageHeader';
import { useCertificate } from '../hooks/useCertificates';
import { useCertificateRenewals } from '../hooks/useCertificates';
import { useCertificateReminders } from '../hooks/useCertificates';

const CertificateDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { certificate, isLoading } = useCertificate(id || null);
    const { renewals, isLoading: isLoadingRenewals } = useCertificateRenewals(id || null);
    const { reminders, isLoading: isLoadingReminders } = useCertificateReminders(id || null);

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
                        <CardHeader>
                            <CardTitle>Renewal History</CardTitle>
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
                                                {getStatusBadge(renewal.status)}
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
        </>
    );
};

export default CertificateDetailPage;

