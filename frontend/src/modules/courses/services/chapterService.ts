import api from '@/core/lib/api';
import { extractYoutubeVideoId, getYoutubeEmbedUrl, isYoutubeVideoId } from '@/core/lib/media-utils';
import { 
  Chapter, 
  ChapterDTO, 
  CreateChapterDTO, 
  UpdateChapterDTO,
  ChapterSearchParams,
  PaginatedResponse
} from '../types/course.types';

// Data transformation functions
const mapChapterDtoToChapter = (chapterDto: ChapterDTO): Chapter => ({
  id: chapterDto.id,
  courseId: chapterDto.courseId,
  title: chapterDto.title,
  description: chapterDto.description,
  order: chapterDto.order,
  duration: chapterDto.duration,
  contentType: chapterDto.contentType as 'video' | 'pdf' | 'text' | 'youtube' | 'image' | 'audio',
  contentUrl: chapterDto.contentUrl,
  youtubeVideoId: chapterDto.youtubeVideoId,
  content: chapterDto.content,
  isFree: chapterDto.isFree,
  isPublished: chapterDto.isPublished,
  publishedAt: chapterDto.publishedAt,
  isActive: chapterDto.isActive,
  createdAt: chapterDto.createdAt,
  updatedAt: chapterDto.updatedAt,
  course: chapterDto.course,
});

const mapChapterToUpdateDto = (chapter: Partial<Chapter>): UpdateChapterDTO => ({
  courseId: chapter.courseId,
  title: chapter.title,
  description: chapter.description,
  order: chapter.order,
  duration: chapter.duration,
  contentType: chapter.contentType,
  contentUrl: chapter.contentUrl,
  youtubeVideoId: chapter.youtubeVideoId,
  content: chapter.content,
  isFree: chapter.isFree,
  isPublished: chapter.isPublished,
  publishedAt: chapter.publishedAt,
  isActive: chapter.isActive,
});

const chapterService = {
  // GET all chapters with pagination
  getChapters: async (params: ChapterSearchParams): Promise<PaginatedResponse<Chapter>> => {
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
    if (params.isFree !== undefined) {
      queryParams.append('isFree', params.isFree.toString());
    }
    if (params.contentType) queryParams.append('contentType', params.contentType);
    if (params.courseId) queryParams.append('courseId', params.courseId);
    if (params.options) queryParams.append('options', 'true');

    const response = await api.get(`/chapters?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapChapterDtoToChapter),
      meta: response.data.meta
    };
  },

  // GET chapters for a specific course
  getChaptersByCourse: async (courseId: string): Promise<Chapter[]> => {
    const response = await api.get(`/chapters/course/${courseId}`);
    return response.data.map(mapChapterDtoToChapter);
  },

  // GET single chapter by ID
  getChapterById: async (id: string): Promise<Chapter> => {
    const response = await api.get(`/chapters/${id}`);
    return mapChapterDtoToChapter(response.data);
  },

  // CREATE chapter
  createChapter: async (chapterData: CreateChapterDTO): Promise<Chapter> => {
    const response = await api.post('/chapters', chapterData);
    return mapChapterDtoToChapter(response.data);
  },

  // UPDATE chapter
  updateChapter: async (id: string, chapterData: UpdateChapterDTO): Promise<Chapter> => {
    const response = await api.patch(`/chapters/${id}`, chapterData);
    return mapChapterDtoToChapter(response.data);
  },

  // DELETE chapter
  deleteChapter: async (id: string): Promise<void> => {
    await api.delete(`/chapters/${id}`);
  },

  // REORDER chapters
  reorderChapters: async (courseId: string, fromOrder: number, toOrder: number): Promise<void> => {
    await api.patch(`/chapters/${courseId}/reorder`, {
      fromOrder,
      toOrder
    });
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

  // Helper function to get content type icon
  getContentTypeIcon: (contentType: string): string => {
    switch (contentType) {
      case 'video':
        return 'Play';
      case 'youtube':
        return 'Youtube';
      case 'pdf':
        return 'FileText';
      case 'text':
        return 'FileText';
      case 'image':
        return 'Image';
      case 'audio':
        return 'Audio';
      default:
        return 'File';
    }
  },

  // Helper function to get content type color
  getContentTypeColor: (contentType: string): string => {
    switch (contentType) {
      case 'video':
        return 'bg-blue-100 text-blue-800';
      case 'youtube':
        return 'bg-red-100 text-red-800';
      case 'pdf':
        return 'bg-orange-100 text-orange-800';
      case 'text':
        return 'bg-green-100 text-green-800';
      case 'image':
        return 'bg-purple-100 text-purple-800';
      case 'audio':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Helper function to validate YouTube video ID
  validateYouTubeId: (videoId: string): boolean => isYoutubeVideoId(videoId),

  // Helper function to extract YouTube video ID from URL
  extractYouTubeId: (url: string): string | null => extractYoutubeVideoId(url),

  // Helper function to get YouTube thumbnail URL
  getYouTubeThumbnail: (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string => {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
  },

  // Helper function to get YouTube embed URL
  getYouTubeEmbedUrl: (videoId: string): string => getYoutubeEmbedUrl(videoId) || '',
};

export default chapterService;
