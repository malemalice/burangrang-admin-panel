import api from '@/core/lib/api';
import {
  Enrollment,
  EnrollmentDTO,
  AssignEnrollmentDTO,
  UpdateEnrollmentDTO,
  CreateEnrollmentDTO,
  EnrollmentSearchParams,
  PaginatedResponse,
  EnrollmentStatus,
} from '../types/enrollment.types';

// Data transformation functions
const mapEnrollmentDtoToEnrollment = (enrollmentDto: EnrollmentDTO): Enrollment => ({
  id: enrollmentDto.id,
  userId: enrollmentDto.userId,
  courseId: enrollmentDto.courseId,
  orderId: enrollmentDto.orderId,
  status: enrollmentDto.status as EnrollmentStatus,
  enrolledAt: enrollmentDto.enrolledAt,
  completedAt: enrollmentDto.completedAt,
  progress: enrollmentDto.progress,
  score: enrollmentDto.score,
  lastAccessedAt: enrollmentDto.lastAccessedAt,
  assignedBy: enrollmentDto.assignedBy,
  assignedAt: enrollmentDto.assignedAt,
  dueDate: enrollmentDto.dueDate,
  isRequired: enrollmentDto.isRequired,
  notes: enrollmentDto.notes,
  user: enrollmentDto.user,
  course: enrollmentDto.course,
  assigner: enrollmentDto.assigner,
  createdAt: enrollmentDto.createdAt,
  updatedAt: enrollmentDto.updatedAt,
});

const enrollmentService = {
  // GET all enrollments with pagination and filtering
  getEnrollments: async (params: EnrollmentSearchParams): Promise<PaginatedResponse<Enrollment>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.courseId) queryParams.append('courseId', params.courseId);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.status) queryParams.append('status', params.status);
    if (params.assignedBy) queryParams.append('assignedBy', params.assignedBy);

    const response = await api.get(`/enrollments?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapEnrollmentDtoToEnrollment),
      meta: response.data.meta,
    };
  },

  // GET single enrollment by ID
  getEnrollmentById: async (id: string): Promise<Enrollment> => {
    const response = await api.get(`/enrollments/${id}`);
    return mapEnrollmentDtoToEnrollment(response.data);
  },

  // GET current user enrollments
  getUserEnrollments: async (): Promise<Enrollment[]> => {
    const response = await api.get('/enrollments/user');
    return response.data.map(mapEnrollmentDtoToEnrollment);
  },

  // CREATE enrollment (self-enrollment)
  createEnrollment: async (enrollmentData: CreateEnrollmentDTO): Promise<Enrollment> => {
    const response = await api.post('/enrollments', enrollmentData);
    return mapEnrollmentDtoToEnrollment(response.data);
  },

  // ASSIGN course to user (Admin only)
  assignCourse: async (assignData: AssignEnrollmentDTO): Promise<Enrollment> => {
    const response = await api.post('/enrollments/assign', assignData);
    return mapEnrollmentDtoToEnrollment(response.data);
  },

  // UPDATE enrollment
  updateEnrollment: async (id: string, updateData: UpdateEnrollmentDTO): Promise<Enrollment> => {
    const response = await api.patch(`/enrollments/${id}`, updateData);
    return mapEnrollmentDtoToEnrollment(response.data);
  },

  // Helper function to get status color
  getStatusColor: (status: EnrollmentStatus | string): string => {
    switch (status) {
      case EnrollmentStatus.INVITED:
        return 'bg-blue-100 text-blue-800';
      case EnrollmentStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case EnrollmentStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      case EnrollmentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case EnrollmentStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Helper function to format status label
  formatStatus: (status: EnrollmentStatus | string): string => {
    switch (status) {
      case EnrollmentStatus.INVITED:
        return 'Invited';
      case EnrollmentStatus.ACTIVE:
        return 'Active';
      case EnrollmentStatus.COMPLETED:
        return 'Completed';
      case EnrollmentStatus.CANCELLED:
        return 'Cancelled';
      case EnrollmentStatus.EXPIRED:
        return 'Expired';
      default:
        return status;
    }
  },
};

export default enrollmentService;
