import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Eye, MoreHorizontal } from 'lucide-react';
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
import { useHealthQuizzes } from '../hooks/useHealthQuizzes';
import { Quiz } from '@/modules/quizzes/types/quiz.types';
import { formatDateTime } from '@/core/utils/date';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

const HealthQuizzesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { quizzes, totalQuizzes, isLoading, fetchQuizzes, deleteQuiz } = useHealthQuizzes();
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    await fetchQuizzes({
      page: pageIndex + 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, [fetchQuizzes, pageIndex, limit]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleDeleteClick = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const formatCreator = (q: Quiz) => {
    if (q.creator) {
      const name = [q.creator.firstName, q.creator.lastName].filter(Boolean).join(' ').trim();
      if (name) return name;
      if (q.creator.email) return q.creator.email;
    }
    return q.createdBy || '—';
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    try {
      await deleteQuiz(quizToDelete.id);
      toast.success('Questionnaire removed');
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
      loadQuizzes();
    } catch {
      /* toast in hook */
    }
  };

  const columns = [
    {
      id: 'title',
      header: 'Title',
      cell: (q: Quiz) => (
        <div>
          <div className="font-medium flex items-center gap-2 flex-wrap">
            <span>{q.title}</span>
          </div>
          {q.questions && (
            <div className="text-xs text-muted-foreground mt-1">
              {q.questions.length} question{q.questions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'defaultForHealthScreening',
      header: 'Default for screening',
      cell: (q: Quiz) =>
        q.isDefaultForHealthScreening ? (
          <Badge variant="secondary" className="text-xs font-normal">
            Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No</span>
        ),
      isSortable: false,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (q: Quiz) => (
        <span className="text-sm whitespace-nowrap">{formatDateTime(q.createdAt)}</span>
      ),
      isSortable: true,
    },
    {
      id: 'updatedAt',
      header: 'Updated',
      cell: (q: Quiz) => (
        <span className="text-sm whitespace-nowrap">{formatDateTime(q.updatedAt)}</span>
      ),
      isSortable: true,
    },
    {
      id: 'createdBy',
      header: 'Created by',
      cell: (q: Quiz) => <span className="text-sm">{formatCreator(q)}</span>,
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (q: Quiz) => (
        <DropdownMenu
          open={openDropdownId === q.id}
          onOpenChange={(open) => setOpenDropdownId(open ? q.id : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('health-quiz:read') && (
              <DropdownMenuItem onClick={() => navigate(`/health-quizzes/${q.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
            )}
            {hasPermission('health-quiz:update') && (
              <DropdownMenuItem onClick={() => navigate(`/health-quizzes/${q.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {(hasPermission('health-quiz:read') || hasPermission('health-quiz:update')) &&
              hasPermission('health-quiz:delete') && <DropdownMenuSeparator />}
            {hasPermission('health-quiz:delete') && (
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(q, e)}
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
        title="Health questionnaires"
        subtitle="Manage health declaration templates (no scoring)"
        actions={
          <PermissionGuard permission="health-quiz:create">
            <Button onClick={() => navigate('/health-quizzes/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
          </PermissionGuard>
        }
      />
      <DataTable
        columns={columns}
        data={quizzes}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalQuizzes / limit) || 1,
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalQuizzes,
        }}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete questionnaire"
        description={`Remove "${quizToDelete?.title}"?`}
        variant="destructive"
      />
    </div>
  );
};

export default HealthQuizzesPage;
