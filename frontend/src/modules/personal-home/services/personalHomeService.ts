import type { PersonalHomeData } from '../types/personal-home.types';

const MOCK_NEEDS_MY_ACTION: PersonalHomeData['needsMyAction'] = [
  {
    id: 'wp-1',
    type: 'work_permit_approval',
    title: 'Hot work - Building A',
    description: 'Work permit awaiting your approval',
    link: '/work-permits',
    priority: 'high',
  },
  {
    id: 'wp-2',
    type: 'work_permit_approval',
    title: 'Confined space - Tank 3',
    link: '/work-permits',
    priority: 'medium',
  },
  {
    id: 'ppe-1',
    type: 'ppe_withdrawal_approval',
    title: 'Safety helmets x 10',
    link: '/ppe/withdrawals',
    priority: 'medium',
  },
  {
    id: 'rem-1',
    type: 'reminder',
    title: 'Submit monthly safety report',
    dueDate: '2025-02-10',
    link: '/reminders',
    priority: 'high',
  },
  {
    id: 'rem-2',
    type: 'reminder',
    title: 'Renew First Aid certificate',
    dueDate: '2025-02-15',
    link: '/reminders',
    priority: 'medium',
  },
];

const MOCK_PERSONAL_HOME: PersonalHomeData = {
  userGreeting: {
    displayName: 'Alex Johnson',
    role: 'HSE Officer',
  },
  enrollments: {
    inProgress: 3,
    overdue: 1,
    total: 12,
  },
  certificates: {
    expiringIn30Days: 2,
    totalActive: 5,
  },
  reminders: {
    upcoming: 4,
    overdue: 1,
    items: [
      {
        id: '1',
        title: 'Submit monthly safety report',
        dueDate: '2025-02-10',
        status: 'OVERDUE',
      },
      {
        id: '2',
        title: 'Renew First Aid certificate',
        dueDate: '2025-02-15',
        status: 'UPCOMING',
      },
      {
        id: '3',
        title: 'Complete Fire Safety course',
        dueDate: '2025-02-20',
        status: 'UPCOMING',
      },
      {
        id: '4',
        title: 'PPE stock audit',
        dueDate: '2025-02-25',
        status: 'UPCOMING',
      },
    ],
  },
  pendingApprovals: {
    count: 3,
    items: [
      { id: 'wp-1', type: 'Work Permit', title: 'Hot work - Building A' },
      { id: 'wp-2', type: 'Work Permit', title: 'Confined space - Tank 3' },
      { id: 'ppe-1', type: 'PPE Withdrawal', title: 'Safety helmets x 10' },
    ],
  },
  quickLinks: [
    { label: 'My Enrollments', path: '/enrollments', icon: 'GraduationCap' },
    { label: 'My Certificates', path: '/certificates', icon: 'Award' },
    { label: 'Reminders', path: '/reminders', icon: 'Bell' },
    { label: 'Work Permits', path: '/work-permits', icon: 'FileCheck' },
    { label: 'Courses', path: '/courses', icon: 'BookOpen' },
  ],
  needsMyAction: MOCK_NEEDS_MY_ACTION,
};

const personalHomeService = {
  getPersonalHomeData: async (): Promise<PersonalHomeData> => {
    return Promise.resolve(MOCK_PERSONAL_HOME);
  },
};

export default personalHomeService;
