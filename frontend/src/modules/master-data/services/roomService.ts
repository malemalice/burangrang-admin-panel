import api from '@/core/lib/api';
import { RoomDTO, CreateRoomDTO, UpdateRoomDTO, AreaDTO } from '../types/master-data.types';

export interface RoomsResponse {
  data: RoomDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AreasResponse {
  data: AreaDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface FetchRoomsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  areaId?: string;
}

const roomService = {
  /**
   * Fetch paginated list of rooms
   */
  async getRooms(params: FetchRoomsParams = {}): Promise<RoomsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.areaId) queryParams.append('areaId', params.areaId);

    const response = await api.get<RoomsResponse>(`/rooms?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Fetch a single room by ID
   */
  async getRoom(id: string): Promise<RoomDTO> {
    const response = await api.get<RoomDTO>(`/rooms/${id}`);
    return response.data;
  },

  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomDTO): Promise<RoomDTO> {
    const response = await api.post<RoomDTO>('/rooms', data);
    return response.data;
  },

  /**
   * Update an existing room
   */
  async updateRoom(id: string, data: UpdateRoomDTO): Promise<RoomDTO> {
    const response = await api.patch<RoomDTO>(`/rooms/${id}`, data);
    return response.data;
  },

  /**
   * Delete a room
   */
  async deleteRoom(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },

  /**
   * Fetch available areas for dropdown
   */
  async getAreas(params: { isActive?: boolean; search?: string; hasRoom?: boolean } = {}): Promise<AreasResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', '100'); // Get all areas for dropdown
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.hasRoom !== undefined) queryParams.append('hasRoom', params.hasRoom.toString());

    const response = await api.get<AreasResponse>(`/areas?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Fetch a single area by ID
   */
  async getArea(id: string): Promise<AreaDTO> {
    const response = await api.get<AreaDTO>(`/areas/${id}`);
    return response.data;
  },
};

export default roomService;
