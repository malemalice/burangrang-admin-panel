/**
 * Environmental Measurement module types
 */

export interface EnvironmentalMeasurement {
  id: string;
  roomId: string;
  lighting?: number;
  noise?: number;
  humidity?: number;
  temperature?: number;
  remarks?: string;
  date: string;
  status?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  room?: {
    id: string;
    name: string;
    code: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateEnvironmentalMeasurementDTO {
  roomId: string;
  lighting?: number;
  noise?: number;
  humidity?: number;
  temperature?: number;
  remarks?: string;
  date: string;
  isActive?: boolean;
}

export interface UpdateEnvironmentalMeasurementDTO {
  roomId?: string;
  lighting?: number;
  noise?: number;
  humidity?: number;
  temperature?: number;
  remarks?: string;
  date?: string;
  isActive?: boolean;
  status?: string;
}

export interface EnvironmentalMeasurementFilters {
  roomId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  search?: string;
  status?: string;
}
