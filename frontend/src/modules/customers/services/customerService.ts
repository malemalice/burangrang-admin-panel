import api from '@/core/lib/api';
import { CustomerDTO, CreateCustomerDTO, UpdateCustomerDTO, Customer, PaginatedResponse, PaginationParams, CustomerStats } from '../types/customer.types';

// Data transformation functions
const mapCustomerDtoToCustomer = (customerDto: CustomerDTO): Customer => ({
  id: customerDto.id,
  userId: customerDto.userId,
  phone: customerDto.phone,
  address: customerDto.address,
  city: customerDto.city,
  state: customerDto.state,
  country: customerDto.country,
  postalCode: customerDto.postalCode,
  dateOfBirth: customerDto.dateOfBirth,
  gender: customerDto.gender,
  isActive: customerDto.isActive,
  createdAt: customerDto.createdAt,
  updatedAt: customerDto.updatedAt,
  user: customerDto.user,
});

const mapCustomerToUpdateDto = (customer: Partial<Customer>): UpdateCustomerDTO => ({
  phone: customer.phone,
  address: customer.address,
  city: customer.city,
  state: customer.state,
  country: customer.country,
  postalCode: customer.postalCode,
  dateOfBirth: customer.dateOfBirth,
  gender: customer.gender,
});

const customerService = {
  // GET all with pagination
  getCustomers: async (params: PaginationParams): Promise<PaginatedResponse<Customer>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/customers?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapCustomerDtoToCustomer),
      meta: response.data.meta
    };
  },

  // GET single customer
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return mapCustomerDtoToCustomer(response.data);
  },

  // GET customer by user ID
  getCustomerByUserId: async (userId: string): Promise<Customer> => {
    const response = await api.get(`/customers/user/${userId}`);
    return mapCustomerDtoToCustomer(response.data);
  },

  // CREATE customer
  createCustomer: async (customerData: CreateCustomerDTO): Promise<Customer> => {
    const response = await api.post('/customers', customerData);
    return mapCustomerDtoToCustomer(response.data);
  },

  // UPDATE customer
  updateCustomer: async (id: string, customerData: UpdateCustomerDTO): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}`, customerData);
    return mapCustomerDtoToCustomer(response.data);
  },

  // DELETE customer
  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // GET customer statistics
  getCustomerStats: async (): Promise<CustomerStats> => {
    const response = await api.get('/customers/stats');
    return response.data;
  },
};

export default customerService;
