import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  BookOpen,
  Clock,
  Star,
  MoreHorizontal,
  Play,
  FileText,
  Youtube,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { useCourses } from '../hooks/useCourses';
import { useCourseStats } from '../hooks/useCourses';
import courseService from '../services/courseService';
import { Course, CourseSearchParams, CourseFilters } from '../types/course.types';
import { userService } from '@/modules/users';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

const CoursesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const {
    courses,
    totalCourses,
    currentPage,
    isLoading,
    error,
    fetchCourses,
    deleteCourse
  } = useCourses();
  const { stats, fetchStats } = useCourseStats();

  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string | number | boolean; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields for courses
  const filterFields: FilterField[] = [
    {
      id: 'title',
      label: 'Title',
      type: 'text'
    },
    {
      id: 'instructorId',
      label: 'Instructor',
      type: 'select',
      options: instructors.map(instructor => ({
        label: instructor.name,
        value: instructor.id
      }))
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' }
      ]
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' }
      ]
    },
    {
      id: 'language',
      label: 'Language',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Indonesian', value: 'id' }
      ]
    }
  ];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load instructors and stats for filters
        const instructorsResponse = await userService.getUsers({ page: 1, limit: 100, options: true });

        setInstructors(
          instructorsResponse.data.map(user => ({
            id: user.id,
            name: `${user.name}`
          }))
        );

        // Load stats
        await fetchStats();
      } catch (error) {
        console.error('Failed to load filter data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load courses based on current filters and search
  const loadCourses = useCallback(async () => {
    const params: CourseSearchParams = {
      page: pageIndex + 1,
      limit,
      search: searchTerm || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    // Apply tab filters
    switch (activeTab) {
      case 'published':
        params.status = 'published';
        break;
      case 'draft':
        params.status = 'draft';
        break;
      case 'review':
        params.status = 'review';
        break;
      case 'archived':
        params.status = 'archived';
        break;
    }

    // Apply active filters
    Object.entries(activeFilters).forEach(([key, filter]) => {
      if (filter.value !== undefined && filter.value !== '') {
        (params as unknown as Record<string, string | number | boolean>)[key] = filter.value;
      }
    });

    await fetchCourses(params);
  }, [pageIndex, limit, searchTerm, activeTab, activeFilters]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const filterMap: Record<string, { value: string | number | boolean; label: string }> = {};
    filters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== '') {
        // Convert complex filter values to simple types
        let simpleValue: string | number | boolean;
        if (typeof filter.value === 'string' || typeof filter.value === 'number' || typeof filter.value === 'boolean') {
          simpleValue = filter.value;
        } else {
          simpleValue = filter.value.toString();
        }

        filterMap[filter.id] = {
          value: simpleValue,
          label: simpleValue.toString()
        };
      }
    });
    setActiveFilters(filterMap);
    setPageIndex(0);
  };

  const handleDeleteClick = (course: Course, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (courseToDelete) {
      try {
        await deleteCourse(courseToDelete.id);
        setOpenDropdownId(null); // Ensure dropdown is closed
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
        await loadCourses(); // Reload to update the list
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const getDifficultyColor = (difficulty: string) => {
    return courseService.getDifficultyColor(difficulty);
  };

  const getStatusColor = (status: string) => {
    return courseService.getStatusColor(status);
  };

  const formatDuration = (minutes: number) => {
    return courseService.formatDuration(minutes);
  };

  // Define columns for the data table
  const columns = [
    {
      id: 'course',
      header: 'Course',
      cell: (course: Course) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={course.thumbnailUrl} alt={course.title} />
            <AvatarFallback>
              <BookOpen className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 max-w-[250px]">
            <div className="font-medium text-gray-900 truncate" title={course.title}>{course.title}</div>
            <div className="text-sm text-gray-500 truncate">
              by {course.instructor?.firstName || course.instructor?.lastName
                ? `${course.instructor?.firstName || ''} ${course.instructor?.lastName || ''}`.trim()
                : 'Unknown Instructor'}
            </div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (course: Course) => (
        <Badge variant="outline" className={`${getStatusColor(course.status)} border-0 text-xs capitalize`}>
          {course.status}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      cell: (course: Course) => (
        <Badge variant="outline" className={`${getDifficultyColor(course.difficulty)} border-0`}>
          {course.difficulty}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'stats',
      header: 'Stats',
      cell: (course: Course) => (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-gray-400" />
            <span>{course.totalChapters} chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
        </div>
      ),
      isSortable: false
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (course: Course) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" /> View
          </Button>
          <DropdownMenu
            open={openDropdownId === course.id}
            onOpenChange={(open) => {
              setOpenDropdownId(open ? course.id : null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasPermission('course:update') && (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit course
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}?tab=chapters`)}>
                    <BookOpen className="mr-2 h-4 w-4" /> Manage chapters
                  </DropdownMenuItem>
                </>
              )}
              {hasPermission('course:update') && hasPermission('course:delete') && (
                <DropdownMenuSeparator />
              )}
              {hasPermission('course:delete') && (
                <DropdownMenuItem
                  onClick={(e) => handleDeleteClick(course, e)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      isSortable: false
    }
  ];

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Manage your course catalog and content"
        actions={
          <PermissionGuard permission="course:create">
            <Button onClick={() => navigate('/courses/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add Course
            </Button>
          </PermissionGuard>
        }
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={courses}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalCourses / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalCourses
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Course"
        description={`Are you sure you want to delete "${courseToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default CoursesPage;
