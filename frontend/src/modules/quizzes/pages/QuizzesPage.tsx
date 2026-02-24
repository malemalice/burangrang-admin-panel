import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  FileQuestion,
  MoreHorizontal,
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
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
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { useQuizzes } from '../hooks/useQuizzes';
import { Quiz, QuizSearchParams } from '../types/quiz.types';
import quizService from '../services/quizService';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

const QuizzesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const {
    quizzes,
    totalQuizzes,
    currentPage,
    isLoading,
    error,
    fetchQuizzes,
    deleteQuiz,
  } = useQuizzes();

  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string | number | boolean; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Define filter fields for quizzes
  const filterFields: FilterField[] = [
    {
      id: 'title',
      label: 'Title',
      type: 'text',
    },
    {
      id: 'entity',
      label: 'Entity Type',
      type: 'select',
      options: [
        { label: 'Standalone', value: 'STANDALONE' },
        { label: 'Course', value: 'COURSE' },
        { label: 'Chapter', value: 'CHAPTER' },
      ],
    },
    {
      id: 'isPublished',
      label: 'Published',
      type: 'select',
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      id: 'isActive',
      label: 'Active',
      type: 'select',
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  ];

  // Load quizzes based on current filters and search
  const loadQuizzes = useCallback(async () => {
    const params: QuizSearchParams = {
      page: pageIndex + 1,
      limit,
      search: searchTerm || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    // Apply tab filters
    switch (activeTab) {
      case 'published':
        params.isPublished = true;
        break;
      case 'draft':
        params.isPublished = false;
        break;
    }

    // Apply active status tab filter
    // Only set isActive if tab is explicitly "active" or "inactive"
    // If "all", don't set isActive (leave it undefined to show all)
    if (activeStatusTab === 'active') {
      params.isActive = true;
    } else if (activeStatusTab === 'inactive') {
      params.isActive = false;
    }
    // If 'all', don't set isActive (leave it undefined)

    // Apply active filters
    // Note: isActive filter from activeFilters should not override tab filter
    Object.entries(activeFilters).forEach(([key, filter]) => {
      if (filter.value !== undefined && filter.value !== '') {
        // Skip isActive if it's already set by tab filter
        if (key === 'isActive' && activeStatusTab !== 'all') {
          return; // Tab filter takes priority
        }
        if (key === 'isPublished' || key === 'isActive') {
          (params as Record<string, any>)[key] = filter.value === 'true' || filter.value === true;
        } else if (key === 'entity') {
          // Send STANDALONE as filter value for standalone quizzes
          (params as Record<string, any>)[key] = filter.value;
        } else {
          (params as Record<string, any>)[key] = filter.value;
        }
      }
    });

    await fetchQuizzes(params);
  }, [pageIndex, limit, searchTerm, activeTab, activeStatusTab, activeFilters, fetchQuizzes]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const filterMap: Record<string, { value: string | number | boolean; label: string }> = {};
    filters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== '') {
        let simpleValue: string | number | boolean;
        if (typeof filter.value === 'string' || typeof filter.value === 'number' || typeof filter.value === 'boolean') {
          simpleValue = filter.value;
        } else {
          simpleValue = filter.value.toString();
        }

        filterMap[filter.id] = {
          value: simpleValue,
          label: simpleValue.toString(),
        };
      }
    });
    setActiveFilters(filterMap);
    setPageIndex(0);
  };

  const handleActiveStatusTabChange = (value: string) => {
    setActiveStatusTab(value);
    setPageIndex(0);
    // Remove isActive from activeFilters when switching to 'all' tab to avoid conflicts
    if (value === 'all') {
      setActiveFilters((prev) => {
        const updated = { ...prev };
        delete updated.isActive;
        return updated;
      });
    }
  };

  const handleDeleteClick = (quiz: Quiz, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (quizToDelete) {
      try {
        await deleteQuiz(quizToDelete.id);
        toast.success('Quiz deleted successfully');
        setOpenDropdownId(null); // Ensure dropdown is closed
        setDeleteDialogOpen(false);
        setQuizToDelete(null);
        await loadQuizzes();
      } catch (error) {
        console.error('Failed to delete quiz:', error);
      }
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setQuizToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const getEntityLabel = (quiz: Quiz) => {
    if (quiz.entity === 'COURSE') {
      return quiz.course ? `Course: ${quiz.course.title}` : 'Course';
    }
    if (quiz.entity === 'CHAPTER') {
      return quiz.chapter ? `Chapter: ${quiz.chapter.title}` : 'Chapter';
    }
    return 'Standalone';
  };

  const getEntityIcon = (quiz: Quiz) => {
    if (quiz.entity === 'COURSE') return <BookOpen className="h-4 w-4" />;
    if (quiz.entity === 'CHAPTER') return <FileText className="h-4 w-4" />;
    return <FileQuestion className="h-4 w-4" />;
  };

  // Define columns for the data table
  const columns = [
    {
      id: 'title',
      header: 'Quiz',
      cell: (quiz: Quiz) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getEntityIcon(quiz)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate">{quiz.title}</div>
            <div className="text-sm text-muted-foreground truncate">
              {getEntityLabel(quiz)}
            </div>
            {quiz.questions && (
              <div className="text-xs text-muted-foreground/70 mt-1">
                {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (quiz: Quiz) => (
        <div className="flex flex-col gap-1">
          {quiz.isPublished ? (
            <Badge variant="outline" className={`${quizService.getStatusBadgeColor('published')} border-0 text-xs`}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge variant="outline" className={`${quizService.getStatusBadgeColor('draft')} border-0 text-xs`}>
              <XCircle className="h-3 w-3 mr-1" />
              Draft
            </Badge>
          )}
          {!quiz.isActive && (
            <Badge variant="outline" className={`${quizService.getStatusBadgeColor('inactive')} border-0 text-xs`}>
              Inactive
            </Badge>
          )}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'passingScore',
      header: 'Passing Score',
      cell: (quiz: Quiz) => (
        <div className="text-sm font-medium">{quiz.passingScore}%</div>
      ),
      isSortable: true,
    },
    {
      id: 'questions',
      header: 'Questions',
      cell: (quiz: Quiz) => (
        <div className="text-sm text-muted-foreground">
          {quiz.questions?.length || 0}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (quiz: Quiz) => (
        <DropdownMenu
          open={openDropdownId === quiz.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? quiz.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('quiz:read') && (
              <DropdownMenuItem onClick={() => navigate(`/quizzes/${quiz.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View details
              </DropdownMenuItem>
            )}
            {hasPermission('quiz:update') && (
              <DropdownMenuItem onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {(hasPermission('quiz:read') || hasPermission('quiz:update')) && hasPermission('quiz:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('quiz:delete') && (
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(quiz, e)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quizzes"
        subtitle="Manage quizzes and assessments"
        actions={
          <PermissionGuard permission="quiz:create">
            <Button onClick={() => navigate('/quizzes/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create Quiz
            </Button>
          </PermissionGuard>
        }
      >
        <Tabs value={activeStatusTab} onValueChange={handleActiveStatusTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={quizzes}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalQuizzes / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalQuizzes,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Quiz"
        description={`Are you sure you want to delete "${quizToDelete?.title}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  );
};

export default QuizzesPage;
