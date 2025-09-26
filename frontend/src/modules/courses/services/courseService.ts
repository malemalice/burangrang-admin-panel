import api from '@/core/lib/api';
import { 
  Course, 
  CourseDTO, 
  CreateCourseDTO, 
  UpdateCourseDTO,
  CourseSearchParams,
  PaginatedResponse,
  CourseStats
} from '../types/course.types';

// Data transformation functions
const mapCourseDtoToCourse = (courseDto: CourseDTO): Course => ({
  id: courseDto.id,
  title: courseDto.title,
  slug: courseDto.slug,
  description: courseDto.description,
  shortDescription: courseDto.shortDescription,
  thumbnailUrl: courseDto.thumbnailUrl,
  totalChapters: courseDto.totalChapters,
  totalDuration: courseDto.totalDuration,
  difficulty: courseDto.difficulty as 'beginner' | 'intermediate' | 'advanced',
  language: courseDto.language,
  rating: courseDto.rating,
  reviewCount: courseDto.reviewCount,
  studentCount: courseDto.studentCount,
  instructorId: courseDto.instructorId,
  status: courseDto.status as 'draft' | 'review' | 'published' | 'archived',
  isPublished: courseDto.isPublished,
  publishedAt: courseDto.publishedAt,
  price: typeof courseDto.price === 'number' ? courseDto.price : (courseDto.price ? Number(courseDto.price) : undefined),
  salePrice: typeof courseDto.salePrice === 'number' ? courseDto.salePrice : (courseDto.salePrice ? Number(courseDto.salePrice) : undefined),
  isActive: courseDto.isActive,
  createdAt: courseDto.createdAt,
  updatedAt: courseDto.updatedAt,
  instructor: courseDto.instructor,
  categories: courseDto.categories,
  chapters: courseDto.chapters,
});

const mapCourseToUpdateDto = (course: Partial<Course>): UpdateCourseDTO => ({
  title: course.title,
  slug: course.slug,
  description: course.description,
  shortDescription: course.shortDescription,
  thumbnailUrl: course.thumbnailUrl,
  difficulty: course.difficulty,
  language: course.language,
  instructorId: course.instructorId,
  status: course.status,
  price: course.price,
  salePrice: course.salePrice,
  isPublished: course.isPublished,
  publishedAt: course.publishedAt,
  isActive: course.isActive,
});

const courseService = {
  // GET all courses with pagination
  getCourses: async (params: CourseSearchParams): Promise<PaginatedResponse<Course>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params.isPublished !== undefined) {
      queryParams.append('isPublished', params.isPublished.toString());
    }
    if (params.status) queryParams.append('status', params.status);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.instructorId) queryParams.append('instructorId', params.instructorId);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.language) queryParams.append('language', params.language);

    const response = await api.get(`/courses?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapCourseDtoToCourse),
      meta: response.data.meta
    };
  },

  // GET single course by ID
  getCourseById: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return mapCourseDtoToCourse(response.data);
  },

  // GET course by slug
  getCourseBySlug: async (slug: string): Promise<Course> => {
    const response = await api.get(`/courses/slug/${slug}`);
    return mapCourseDtoToCourse(response.data);
  },

  // CREATE course
  createCourse: async (courseData: CreateCourseDTO): Promise<Course> => {
    const response = await api.post('/courses', courseData);
    return mapCourseDtoToCourse(response.data);
  },

  // UPDATE course
  updateCourse: async (id: string, courseData: UpdateCourseDTO): Promise<Course> => {
    const response = await api.patch(`/courses/${id}`, courseData);
    return mapCourseDtoToCourse(response.data);
  },

  // DELETE course
  deleteCourse: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  // GET course statistics
  getCourseStats: async (): Promise<CourseStats> => {
    const response = await api.get('/courses/stats');
    return response.data;
  },

  // Helper function to generate slug from title
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  },

  // Helper function to format duration
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  },

  // Helper function to get difficulty color
  getDifficultyColor: (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Helper function to get status color
  getStatusColor: (status: string): string => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Helper function to calculate price display
  getPriceDisplay: (course: Course): { display: string; hasDiscount: boolean } => {
    const price = typeof course.price === 'number' ? course.price : 0;
    const salePrice = typeof course.salePrice === 'number' ? course.salePrice : 0;
    
    if (price === 0) {
      return { display: 'Free', hasDiscount: false };
    }

    if (salePrice > 0 && salePrice < price) {
      return {
        display: `$${salePrice.toFixed(2)}`,
        hasDiscount: true
      };
    }

    return {
      display: `$${price.toFixed(2)}`,
      hasDiscount: false
    };
  },
};

export default courseService;
