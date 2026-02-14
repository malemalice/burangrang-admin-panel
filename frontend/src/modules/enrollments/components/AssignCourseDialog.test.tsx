import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignCourseDialog from './AssignCourseDialog';
import { toast } from 'sonner';

const mockAssignCourse = vi.fn();
const mockGetCourses = vi.fn();
const mockGetUsers = vi.fn();

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
    },
}));

vi.mock('../hooks/useEnrollments', () => ({
    useEnrollments: () => ({
        assignCourse: mockAssignCourse,
    }),
}));

vi.mock('@/modules/courses/services/courseService', () => ({
    default: {
        getCourses: (...args: unknown[]) => mockGetCourses(...args),
    },
}));

vi.mock('@/modules/users/services/userService', () => ({
    default: {
        getUsers: (...args: unknown[]) => mockGetUsers(...args),
    },
}));

describe('AssignCourseDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetCourses.mockResolvedValue({
            data: [
                {
                    id: 'course-1',
                    title: 'Chemical Safety 101',
                },
                {
                    id: 'course-2',
                    title: 'Fire Prevention Basics',
                },
            ],
            meta: { total: 2, page: 1, limit: 100, pageCount: 1 },
        });

        mockGetUsers.mockResolvedValue({
            data: [
                {
                    id: 'user-1',
                    name: 'Alice Johnson',
                    email: 'alice@example.com',
                },
                {
                    id: 'user-2',
                    name: 'Bob Smith',
                    email: 'bob@example.com',
                },
            ],
            meta: { total: 2, page: 1, limit: 100, pageCount: 1 },
        });

        mockAssignCourse.mockResolvedValue({
            enrollment: { id: 'enr-1' },
            emailStatus: 'sent',
        });
    });

    it('shows searchable combobox inputs for user and course selection', async () => {
        const user = userEvent.setup();

        render(<AssignCourseDialog open onOpenChange={vi.fn()} />);

        await waitFor(() => {
            expect(mockGetCourses).toHaveBeenCalled();
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const userComboboxButton = screen.getByRole('button', { name: 'User *' });
        await user.click(userComboboxButton);
        expect(screen.getByPlaceholderText('Search user...')).toBeInTheDocument();

        const courseComboboxButton = screen.getByRole('button', { name: 'Course *' });
        await user.click(courseComboboxButton);
        expect(screen.getByPlaceholderText('Search course...')).toBeInTheDocument();
    });

    it('filters user options through search and keeps payload behavior on submit', async () => {
        const onOpenChange = vi.fn();
        const onSuccess = vi.fn();
        const user = userEvent.setup();

        render(<AssignCourseDialog open onOpenChange={onOpenChange} onSuccess={onSuccess} />);

        await waitFor(() => {
            expect(mockGetCourses).toHaveBeenCalled();
            expect(mockGetUsers).toHaveBeenCalled();
        });

        const userComboboxButton = screen.getByRole('button', { name: 'User *' });
        await user.click(userComboboxButton);

        const userSearch = screen.getByPlaceholderText('Search user...');
        await user.type(userSearch, 'alice');

        expect(screen.getByText('Alice Johnson (alice@example.com)')).toBeInTheDocument();
        expect(screen.queryByText('Bob Smith (bob@example.com)')).not.toBeInTheDocument();

        await user.click(screen.getByText('Alice Johnson (alice@example.com)'));

        const courseComboboxButton = screen.getByRole('button', { name: 'Course *' });
        await user.click(courseComboboxButton);

        const courseSearch = screen.getByPlaceholderText('Search course...');
        await user.type(courseSearch, 'fire');

        expect(screen.getByText('Fire Prevention Basics')).toBeInTheDocument();
        expect(screen.queryByText('Chemical Safety 101')).not.toBeInTheDocument();

        await user.click(screen.getByText('Fire Prevention Basics'));

        await user.click(screen.getByRole('button', { name: /assign course/i }));

        await waitFor(() => {
            expect(mockAssignCourse).toHaveBeenCalledWith({
                userId: 'user-1',
                courseId: 'course-2',
                isRequired: true,
                sendEmail: true,
            });
        });

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSuccess).toHaveBeenCalled();
    });

    it('preserves validation errors when user and course are empty', async () => {
        const user = userEvent.setup();

        render(<AssignCourseDialog open onOpenChange={vi.fn()} />);

        await waitFor(() => {
            expect(mockGetCourses).toHaveBeenCalled();
            expect(mockGetUsers).toHaveBeenCalled();
        });

        await user.click(screen.getByRole('button', { name: /assign course/i }));

        expect(await screen.findByText('User is required')).toBeInTheDocument();
        expect(await screen.findByText('Course is required')).toBeInTheDocument();
        expect(mockAssignCourse).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });
});
