import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Edit, 
  Trash2, 
  Plus, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play,
  FileText,
  Youtube,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import { Separator } from '@/core/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { useCourse } from '../hooks/useCourses';
import { useChapters } from '../hooks/useChapters';
import courseService from '../services/courseService';
import chapterService from '../services/chapterService';
import { Course, Chapter } from '../types/course.types';
import { formatCurrencyDisplay } from '@/shared/utils/currency';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { course, isLoading: courseLoading, fetchCourse } = useCourse(courseId || null);
  const { 
    chapters, 
    totalChapters, 
    isLoading: chaptersLoading, 
    fetchChapters,
    deleteChapter 
  } = useChapters();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Load course data
  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  // Load chapters when course is loaded
  useEffect(() => {
    if (course) {
      fetchChapters({ courseId: course.id, page: 1, limit: 100 });
    }
  }, [course]);

  const handleDeleteChapter = (chapter: Chapter) => {
    setChapterToDelete(chapter);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (chapterToDelete) {
      try {
        await deleteChapter(chapterToDelete.id);
        setDeleteDialogOpen(false);
        setChapterToDelete(null);
        // Reload chapters
        if (course) {
          fetchChapters({ courseId: course.id, page: 1, limit: 100 });
        }
      } catch (error) {
        console.error('Failed to delete chapter:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChapterToDelete(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    return courseService.getDifficultyColor(difficulty);
  };

  const getStatusColor = (status: string) => {
    return courseService.getStatusColor(status);
  };

  const getPriceDisplay = (course: Course) => {
    return courseService.getPriceDisplay(course);
  };

  const formatDuration = (minutes: number) => {
    return courseService.formatDuration(minutes);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
        <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/courses')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={course.thumbnailUrl} alt={course.title} />
              <AvatarFallback>
                <BookOpen className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <Badge variant="outline" className={`${getStatusColor(course.status)} border-0`}>
                  {course.status}
                </Badge>
                {course.isPublished && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-0">
                    Published
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-2">{course.shortDescription || course.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>by {course.instructor?.firstName} {course.instructor?.lastName}</span>
                <span>•</span>
                <span>{formatDuration(course.totalDuration)}</span>
                <span>•</span>
                <span>{course.totalChapters} chapters</span>
                <span>•</span>
                <span>{course.studentCount} students</span>
                {course.rating > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{course.rating.toFixed(1)} ({course.reviewCount})</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Course
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/chapters`)}>
              <BookOpen className="mr-2 h-4 w-4" /> Manage Chapters
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => navigate(`/courses/${course.id}/analytics`)}
            >
              <Users className="mr-2 h-4 w-4" /> View Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chapters">Chapters ({totalChapters})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {course.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>

              {/* Course Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Difficulty</label>
                      <div className="mt-1">
                        <Badge variant="outline" className={`${getDifficultyColor(course.difficulty)} border-0`}>
                          {course.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Language</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {course.language === 'en' ? 'English' : 'Indonesian'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(course.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              {course.categories && course.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {course.categories.map(category => (
                        <Badge key={category.id} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {getPriceDisplay(course).display}
                    </div>
                    {getPriceDisplay(course).hasDiscount && course.product && (
                      <div className="text-sm text-gray-500 line-through mt-1">
                        {formatCurrencyDisplay(course.product.price)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Chapters</span>
                    </div>
                    <span className="font-medium">{course.totalChapters}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <span className="font-medium">{formatDuration(course.totalDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Students</span>
                    </div>
                    <span className="font-medium">{course.studentCount}</span>
                  </div>
                  {course.rating > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm">Rating</span>
                      </div>
                      <span className="font-medium">
                        {course.rating.toFixed(1)} ({course.reviewCount})
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/courses/${course.id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Course
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/courses/${course.id}/chapters`)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Manage Chapters
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chapters" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Course Chapters</h3>
            <Button onClick={() => navigate(`/courses/${course.id}/chapters/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </div>

          {chaptersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : chapters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
                <p className="text-gray-600 mb-4">Start building your course by adding chapters.</p>
                <Button onClick={() => navigate(`/courses/${course.id}/chapters/new`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Chapter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <Card key={chapter.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {chapter.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{chapter.title}</h4>
                            {chapter.isFree && (
                              <Badge variant="outline" className="text-xs">
                                Free
                              </Badge>
                            )}
                            {chapter.isPublished && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-0 text-xs">
                                Published
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {chapter.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              {getContentTypeIcon(chapter.contentType)}
                              <span className="capitalize">{chapter.contentType}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(chapter.duration)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}/chapters/${chapter.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteChapter(chapter)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chapter"
        description={`Are you sure you want to delete "${chapterToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="destructive"
      />
    </div>
  );
};

export default CourseDetailPage;
