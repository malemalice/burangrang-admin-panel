import Notifications from '@/core/pages/Notifications';

{
  path: '/notifications',
  element: (
    <ProtectedRoute>
      <MainLayout>
        <Notifications />
      </MainLayout>
    </ProtectedRoute>
  ),
}, 