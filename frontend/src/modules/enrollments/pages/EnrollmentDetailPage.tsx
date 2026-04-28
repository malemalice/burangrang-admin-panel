import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Calendar, User, BookOpen, CheckCircle, PlayCircle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import PageHeader from '@/core/components/ui/PageHeader';
import enrollmentService from '../services/enrollmentService';
import { Enrollment, EnrollmentStatus } from '../types/enrollment.types';
import { useAuth } from '@/core/lib/auth';
import quizService from '@/modules/quizzes/services/quizService';
import { usePermissions } from '@/core/hooks/usePermissions';

const EnrollmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<
    Array<{
      id: string;
      quizId: string;
      quiz: { id: string; title: string; passingScore?: number };
      attemptNumber: number;
      status: string;
      score: number | null;
      isPassed: boolean;
      startedAt: string;
      completedAt: string | null;
      needsGrading: boolean;
    }>
  >([]);

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!id) {
        setError('Enrollment ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const enrollmentData = await enrollmentService.getEnrollmentById(id);
        setEnrollment(enrollmentData);
      } catch (err: any) {
        console.error('Error fetching enrollment:', err);
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load enrollment data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [id]);

  useEffect(() => {
    const fetchQuizAttempts = async () => {
      if (!id) return;
      try {
        const data = await quizService.getAttemptsByEnrollment(id);
        setQuizAttempts(data);
      } catch {
        setQuizAttempts([]);
      }
    };
    if (enrollment?.id) {
      fetchQuizAttempts();
    }
  }, [enrollment?.id, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Enrollment Details"
          subtitle="View enrollment information"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error || 'Enrollment not found'}</p>
              <Button onClick={() => navigate('/enrollments')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Enrollments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnrolledUser = Boolean(currentUser?.id && enrollment.userId === currentUser.id);
  const canTakeCourse =
    isEnrolledUser &&
    hasPermission('enrollment:read') &&
    Boolean(enrollment.course?.id) &&
    (enrollment.status === EnrollmentStatus.INVITED ||
      enrollment.status === EnrollmentStatus.ACTIVE ||
      enrollment.status === EnrollmentStatus.COMPLETED);
  const canEditEnrollment =
    hasPermission('enrollment:update') &&
    (enrollment.status === EnrollmentStatus.INVITED || enrollment.status === EnrollmentStatus.ACTIVE);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Enrollment Details"
        subtitle="View enrollment information"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/enrollments')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {canTakeCourse && (
              <Button
                onClick={() => navigate(`/courses/${enrollment.course?.id}/learn`)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Take Course
              </Button>
            )}
            {canEditEnrollment && (
              <Button
                onClick={() => navigate(`/enrollments/${enrollment.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={enrollment.course?.thumbnailUrl} alt={enrollment.course?.title} />
                <AvatarFallback>
                  <BookOpen className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">{enrollment.course?.title || 'Unknown Course'}</div>
                {enrollment.course?.slug && (
                  <div className="text-sm text-muted-foreground">{enrollment.course.slug}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback>
                  {enrollment.user ? `${enrollment.user.firstName[0]}${enrollment.user.lastName[0]}` : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">
                  {enrollment.user ? `${enrollment.user.firstName} ${enrollment.user.lastName}` : 'Unknown User'}
                </div>
                <div className="text-sm text-muted-foreground">{enrollment.user?.email || ''}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div>
                <Badge
                  variant="outline"
                  className={`${enrollmentService.getStatusColor(enrollment.status)} border-0`}
                >
                  {enrollmentService.formatStatus(enrollment.status)}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Progress</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
                <span className="text-sm text-foreground">{enrollment.progress.toFixed(0)}%</span>
              </div>
            </div>
            {enrollment.score !== undefined && (
              <div className="space-y-2">
                <Label>Score</Label>
                <div className="text-lg font-semibold">{enrollment.score}</div>
              </div>
            )}
            {enrollment.isRequired && (
              <div className="space-y-2">
                <Label>Required</Label>
                <Badge variant="outline" className="border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Required Enrollment
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates & Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates & Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollment.enrolledAt && (
              <div className="space-y-2">
                <Label>Enrolled At</Label>
                <div className="text-sm">
                  {new Date(enrollment.enrolledAt).toLocaleString()}
                </div>
              </div>
            )}
            {enrollment.assignedAt && (
              <div className="space-y-2">
                <Label>Assigned At</Label>
                <div className="text-sm">
                  {new Date(enrollment.assignedAt).toLocaleString()}
                </div>
              </div>
            )}
            {enrollment.assignedBy && enrollment.assigner && (
              <div className="space-y-2">
                <Label>Assigned By</Label>
                <div className="text-sm">
                  {enrollment.assigner.firstName} {enrollment.assigner.lastName}
                  <div className="text-muted-foreground">{enrollment.assigner.email}</div>
                </div>
              </div>
            )}
            {enrollment.dueDate && (
              <div className="space-y-2">
                <Label>Due Date</Label>
                <div className="text-sm font-medium">
                  {new Date(enrollment.dueDate).toLocaleString()}
                </div>
              </div>
            )}
            {enrollment.completedAt && (
              <div className="space-y-2">
                <Label>Completed At</Label>
                <div className="text-sm">
                  {new Date(enrollment.completedAt).toLocaleString()}
                </div>
              </div>
            )}
            {enrollment.lastAccessedAt && (
              <div className="space-y-2">
                <Label>Last Accessed</Label>
                <div className="text-sm">
                  {new Date(enrollment.lastAccessedAt).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {enrollment.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{enrollment.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Quiz attempts */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Quiz attempts
            </CardTitle>
            <CardDescription>
              Quiz attempts for this enrollment. Click Grade to score essay answers or adjust the final score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizAttempts.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No quiz attempts yet</p>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Quiz</th>
                      <th className="h-10 px-4 text-left font-medium">Attempt</th>
                      <th className="h-10 px-4 text-left font-medium">Score</th>
                      <th className="h-10 px-4 text-left font-medium">Status</th>
                      <th className="h-10 px-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizAttempts.map((attempt) => (
                      <tr key={attempt.id} className="border-b last:border-0">
                        <td className="px-4 py-3">{attempt.quiz?.title ?? 'Unknown'}</td>
                        <td className="px-4 py-3">#{attempt.attemptNumber}</td>
                        <td className="px-4 py-3">
                          {attempt.score != null ? `${Number(attempt.score).toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={quizService.getAttemptStatusBadge(attempt.status as any)}
                          >
                            {attempt.status}
                          </Badge>
                          {attempt.needsGrading && attempt.status === 'COMPLETED' && (
                            <Badge variant="destructive" className="ml-2">
                              Pending grading
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/quizzes/${attempt.quizId}/attempts/${attempt.id}/grade`)
                            }
                          >
                            {attempt.needsGrading && attempt.status === 'COMPLETED'
                              ? 'Grade'
                              : 'View'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnrollmentDetailPage;
