import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Edit,
  Eye,
  UserPlus,
  BookOpen,
  MoreHorizontal,
  Calendar,
  User,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button, ThemeButton } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { useEnrollments } from '../hooks/useEnrollments';
import { useAuth } from '@/core/lib/auth';
import { Enrollment, EnrollmentStatus } from '../types/enrollment.types';
import enrollmentService from '../services/enrollmentService';
import courseService from '@/modules/courses/services/courseService';
import userService from '@/modules/users/services/userService';
import AssignCourseDialog from '../components/AssignCourseDialog';

const EnrollmentsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { updateEnrollment } = useEnrollments();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; firstName: string; lastName: string }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const prevFiltersStringRef = useRef<string>('');

  // Check if user is admin or super admin
  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'Super Admin';
  const userRole = typeof currentUser?.role === 'string' ? currentUser.role : currentUser?.role?.name || '';

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Fetch courses and users for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [coursesResponse, usersResponse] = await Promise.all([
          courseService.getCourses({ page: 1, limit: 100 }),
          isAdmin ? userService.getUsers({ page: 1, limit: 100 }) : Promise.resolve({ data: [], meta: { total: 0 } }),
        ]);

        setCourses(coursesResponse.data.map(c => ({ id: c.id, title: c.title })));
        if (isAdmin) {
          setUsers(usersResponse.data.map(u => ({
            id: u.id,
            name: u.name || `${u.firstName} ${u.lastName}`,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        toast.error('Failed to load filter options');
      }
    };

    fetchFilterOptions();
  }, [isAdmin]);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'courseId',
      label: 'Course',
      type: 'searchableSelect' as const,
      options: courses.map(course => ({
        label: course.title,
        value: course.id,
      })),
    },
    ...(isAdmin ? [{
      id: 'userId',
      label: 'User',
      type: 'searchableSelect' as const,
      options: users.map(user => ({
        label: `${user.name} (${user.email})`,
        value: user.id,
      })),
    }] : []),
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'Invited', value: EnrollmentStatus.INVITED },
        { label: 'Active', value: EnrollmentStatus.ACTIVE },
        { label: 'Completed', value: EnrollmentStatus.COMPLETED },
        { label: 'Cancelled', value: EnrollmentStatus.CANCELLED },
        { label: 'Expired', value: EnrollmentStatus.EXPIRED },
      ],
    },
  ];

  // Track activeFilters changes using a separate effect
  useEffect(() => {
    const filterValues = Object.keys(activeFilters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = activeFilters[key].value;
        return acc;
      }, {} as Record<string, any>);
    const currentFiltersString = JSON.stringify(filterValues);

    if (prevFiltersStringRef.current !== currentFiltersString) {
      prevFiltersStringRef.current = currentFiltersString;
      // Trigger fetch by incrementing refreshKey
      setRefreshKey(prev => prev + 1);
    }
  }, [activeFilters]);

  // Fetch enrollments when dependencies change
  useEffect(() => {
    let isMounted = true;
    let shouldAbort = false;

    // Serialize activeFilters to string for params
    const filterValues = Object.keys(activeFilters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = activeFilters[key].value;
        return acc;
      }, {} as Record<string, any>);

    const fetchEnrollmentsData = async () => {
      if (shouldAbort) return;

      const params = {
        page: pageIndex + 1,
        limit,
        search: searchTerm,
        ...filterValues,
      };

      setIsLoading(true);
      try {
        const response = await enrollmentService.getEnrollments(params);
        if (isMounted && !shouldAbort) {
          setEnrollments(response.data);
          setTotalEnrollments(response.meta.total);
        }
      } catch (error) {
        if (isMounted && !shouldAbort) {
          console.error('Failed to fetch enrollments:', error);
          toast.error('Failed to load enrollments');
        }
      } finally {
        if (isMounted && !shouldAbort) {
          setIsLoading(false);
        }
      }
    };

    fetchEnrollmentsData();

    return () => {
      isMounted = false;
      shouldAbort = true;
    };
  }, [pageIndex, limit, searchTerm, refreshKey]);

  const handleCancelEnrollment = async (enrollment: Enrollment) => {
    try {
      await updateEnrollment(enrollment.id, { status: EnrollmentStatus.CANCELLED });
      setOpenDropdownId(null); // Close dropdown
      // Refresh data by incrementing refresh key
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to cancel enrollment:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};

    filters.forEach(filter => {
      if (filter.id === 'courseId') {
        const courseValue = typeof filter.value === 'string' ? filter.value : String(filter.value);
        const course = courses.find(c => c.id === courseValue);
        newActiveFilters[filter.id] = {
          value: courseValue,
          label: course?.title || '',
        };
      } else if (filter.id === 'userId') {
        const userValue = typeof filter.value === 'string' ? filter.value : String(filter.value);
        const user = users.find(u => u.id === userValue);
        newActiveFilters[filter.id] = {
          value: userValue,
          label: user ? `${user.name} (${user.email})` : '',
        };
      } else if (filter.id === 'status') {
        const statusValue = typeof filter.value === 'string' ? filter.value : String(filter.value);
        const statusLabel = statusValue === EnrollmentStatus.INVITED ? 'Invited' :
          statusValue === EnrollmentStatus.ACTIVE ? 'Active' :
            statusValue === EnrollmentStatus.COMPLETED ? 'Completed' :
              statusValue === EnrollmentStatus.CANCELLED ? 'Cancelled' :
                statusValue === EnrollmentStatus.EXPIRED ? 'Expired' : statusValue;
        newActiveFilters[filter.id] = {
          value: statusValue,
          label: statusLabel,
        };
      } else {
        const filterValue = typeof filter.value === 'string' ? filter.value : String(filter.value);
        newActiveFilters[filter.id] = {
          value: filterValue,
          label: filterValue,
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0);
    // Reset refreshKey when filters change to trigger fetch
    setRefreshKey(0);
  };

  const columns = [
    {
      id: 'course',
      header: 'Course',
      cell: (enrollment: Enrollment) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={enrollment.course?.thumbnailUrl} alt={enrollment.course?.title} />
            <AvatarFallback>
              <BookOpen className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{enrollment.course?.title || 'Unknown Course'}</div>
            {enrollment.course?.slug && (
              <div className="text-sm text-muted-foreground">{enrollment.course.slug}</div>
            )}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'member',
      header: 'Member',
      cell: (enrollment: Enrollment) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {enrollment.user ? `${enrollment.user.firstName[0]}${enrollment.user.lastName[0]}` : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {enrollment.user ? `${enrollment.user.firstName} ${enrollment.user.lastName}` : 'Unknown User'}
            </div>
            <div className="text-sm text-muted-foreground">{enrollment.user?.email || ''}</div>
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (enrollment: Enrollment) => (
        <Badge
          variant="outline"
          className={`${enrollmentService.getStatusColor(enrollment.status)} border-0`}
        >
          {enrollmentService.formatStatus(enrollment.status)}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'assignedBy',
      header: 'Assigned By',
      cell: (enrollment: Enrollment) => (
        enrollment.assigner ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{enrollment.assigner.firstName} {enrollment.assigner.lastName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      isSortable: false,
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      cell: (enrollment: Enrollment) => (
        enrollment.dueDate ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(enrollment.dueDate).toLocaleDateString()}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      isSortable: true,
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: (enrollment: Enrollment) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <span className="text-sm text-foreground">{enrollment.progress.toFixed(0)}%</span>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (enrollment: Enrollment) => (
        <DropdownMenu
          open={openDropdownId === enrollment.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? enrollment.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/enrollments/${enrollment.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            {(enrollment.status === EnrollmentStatus.INVITED || enrollment.status === EnrollmentStatus.ACTIVE) && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/enrollments/${enrollment.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleCancelEnrollment(enrollment)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Course Enrollments"
        subtitle="Manage course enrollments and assignments"
        actions={
          isAdmin && (
            <ThemeButton onClick={() => setAssignDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Assign Course
            </ThemeButton>
          )
        }
      />

      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalEnrollments / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalEnrollments,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      {isAdmin && (
        <AssignCourseDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={() => {
            setAssignDialogOpen(false);
            // Refresh data by incrementing refresh key
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </>
  );
};

export default EnrollmentsPage;
