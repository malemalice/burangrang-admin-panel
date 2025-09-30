import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import { Separator } from '@/core/components/ui/separator';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { useCustomer } from '../hooks/useCustomers';

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { customer, isLoading, error } = useCustomer(id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Customer not found</p>
          <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customer Details</h1>
            <p className="text-gray-600">View customer information and activity</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/customers/${customer.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" /> Edit Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {customer.user?.firstName?.charAt(0) || 'C'}
                  {customer.user?.lastName?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {customer.user?.firstName} {customer.user?.lastName}
                </h3>
                <Badge variant="outline" className={`${
                  customer.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                } border-0`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{customer.user?.email}</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                </div>
              )}

              {customer.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-gray-600">
                      {new Date(customer.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {customer.gender && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-gray-600 capitalize">{customer.gender}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address and Location Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address & Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.address || customer.city || customer.country ? (
              <div className="space-y-4">
                {customer.address && (
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-gray-600">{customer.address}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {customer.city && (
                    <div>
                      <p className="text-sm font-medium">City</p>
                      <p className="text-sm text-gray-600">{customer.city}</p>
                    </div>
                  )}

                  {customer.state && (
                    <div>
                      <p className="text-sm font-medium">State/Province</p>
                      <p className="text-sm text-gray-600">{customer.state}</p>
                    </div>
                  )}

                  {customer.country && (
                    <div>
                      <p className="text-sm font-medium">Country</p>
                      <p className="text-sm text-gray-600">{customer.country}</p>
                    </div>
                  )}
                </div>

                {customer.postalCode && (
                  <div>
                    <p className="text-sm font-medium">Postal Code</p>
                    <p className="text-sm text-gray-600">{customer.postalCode}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No address information provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Associated User Information</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.user ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-gray-600">{customer.user.role?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Office</p>
                <p className="text-sm text-gray-600">{customer.user.office?.name}</p>
              </div>
              {customer.user.department && (
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-gray-600">{customer.user.department.name}</p>
                </div>
              )}
              {customer.user.jobPosition && (
                <div>
                  <p className="text-sm font-medium">Job Position</p>
                  <p className="text-sm text-gray-600">{customer.user.jobPosition.name}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No user information available</p>
          )}
        </CardContent>
      </Card>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Customer ID</p>
              <p className="text-sm text-gray-600 font-mono">{customer.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="text-sm text-gray-600 font-mono">{customer.userId}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-gray-600">
                {new Date(customer.createdAt).toLocaleDateString()} at{' '}
                {new Date(customer.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-gray-600">
                {new Date(customer.updatedAt).toLocaleDateString()} at{' '}
                {new Date(customer.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetailPage;
