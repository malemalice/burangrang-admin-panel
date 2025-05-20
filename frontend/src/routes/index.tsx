import Notifications from '@/pages/Notifications';

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