# PRD: Learning Management System (LMS)

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Learning Management System covers courses (with status and slug), chapters (ordered, per course), enrollments (assign course to user, learning context with progress), quizzes (create, link to course/chapter, assign to users, attempts and answers), and progress (per-chapter completion). Enrollments can be data-scoped (self/department/super). List endpoints support an `options` bypass where applicable.

**Scope:** Backend `courses`, `chapters`, `enrollments`, `quizzes`, `progress` modules; frontend `courses`, `enrollments`, `quizzes` modules.

## Key Features

- **Courses:** Create, list (paginated, filter by status, search; options bypass), get by ID or slug, stats, update, delete. Course has status (e.g. DRAFT, PUBLISHED), slug for public URLs.
- **Chapters:** Create, list (options bypass), get by course (admin), get public by course (unauthenticated), get purchased by course (enrolled users), get by ID, update, reorder (bulk by courseId), delete. Chapters belong to a course and have order.
- **Enrollments:** Create enrollment; get current user enrollments (GET user); assign course to user (admin); list (paginated, filters; options bypass; may be data-scoped); get learning context (course, chapters, progress) for enrollment; get by ID, update.
- **Quizzes:** Create, list (options bypass), get by ID, update, delete; link quiz to course or chapter; assign standalone quiz to users; start attempt (POST :id/attempts); get current in-progress attempt; submit answer (POST attempts/:attemptId/answers); submit attempt (POST attempts/:attemptId/submit); grade essay answer (PATCH answers/:answerId/grade).
- **Progress:** Get progress for chapter (GET :chapterId); update progress (PATCH :chapterId); mark chapter complete (POST :chapterId/complete). Used in learning context for enrolled users.

## User Roles & Permissions

- **Course/Chapter:** Permissions for create, list, read, update, delete (course and chapter endpoints). Public route for chapters by course (no auth). Purchased route for chapters (enrolled users).
- **Enrollment:** create, list (options bypass; data-scoped where implemented), read, update; assign (admin). GET user enrollments for current user.
- **Quiz:** create, list (options bypass), read, update, delete; link; assign; attempt/answer/submit/grade (progress or quiz permissions).
- **Progress:** progress:read, progress:update for get/update/complete.

## User Stories

- As an admin, I can create and manage courses and chapters (order, content) so that learning paths are available.
- As an admin, I can assign courses to users and see enrollments so that training is tracked.
- As a learner, I can see my enrollments and learning context (course, chapters, progress) so that I can continue learning.
- As a learner, I can complete chapters and have progress recorded so that completion is tracked.
- As an admin or author, I can create quizzes, link them to courses/chapters, and assign them to users so that assessments are delivered.
- As a learner, I can start a quiz attempt, submit answers, and complete the attempt so that I am assessed; essay answers can be graded manually.

## Key Workflows

1. **Course authoring:** Create course (status, slug, etc.) → create chapters (order) → reorder chapters as needed. Optionally link quizzes to course or chapter.
2. **Enrollment:** Admin assigns course to user (POST enrollments/assign) or user is enrolled via create. User sees GET enrollments/user; opening an enrollment loads GET :id/learning-context (course, chapters, progress).
3. **Learning:** User opens course player → progress per chapter is read/updated (GET/PATCH progress/:chapterId); user marks chapter complete (POST progress/:chapterId/complete).
4. **Quiz attempt:** User starts attempt (POST quizzes/:id/attempts) → submits answers (POST attempts/:attemptId/answers) → submits attempt (POST attempts/:attemptId/submit). Instructor grades essay answers (PATCH answers/:answerId/grade). Current in-progress attempt (GET :id/attempts/current) for resume.

## Data Model Summary

- **Course:** id, name, slug, description, status, etc. Has many Chapter, many Enrollment (via Enrollment), many Quiz (link).
- **Chapter:** id, courseId, title, order, content (e.g. rich text/URL), etc. Has many Progress (per enrollment).
- **Enrollment:** id, userId, courseId, assignedBy?, status?, etc. Relations: user, course; progress records per chapter. Data-scoped by userId/department where implemented.
- **Quiz:** id, title, description, etc. Questions and options. Linked to course or chapter; can be assigned to users. Attempts and answers stored.
- **Progress:** enrollment + chapter scoped; completion state (e.g. completedAt). Used in learning context.

## API Endpoints Summary

### Courses
- POST /courses — create | GET /courses — list (options bypass) | GET /courses/stats — statistics | GET /courses/slug/:slug — by slug | GET /courses/:id — by ID | PATCH /courses/:id — update | DELETE /courses/:id — delete

### Chapters
- POST /chapters — create | GET /chapters — list (options bypass) | GET /chapters/course/:courseId — by course (admin) | GET /chapters/public/course/:courseId — public by course | GET /chapters/purchased/course/:courseId — for purchased users | GET /chapters/:id — by ID | PATCH /chapters/:id — update | PATCH /chapters/:courseId/reorder — reorder | DELETE /chapters/:id — delete

### Enrollments
- POST /enrollments — create | GET /enrollments/user — current user enrollments | POST /enrollments/assign — assign course to user | GET /enrollments — list (options bypass; data-scoped) | GET /enrollments/:id/learning-context — course, chapters, progress | GET /enrollments/:id — by ID | PATCH /enrollments/:id — update

### Quizzes
- POST /quizzes — create | GET /quizzes — list (options bypass) | GET /quizzes/:id — by ID | PATCH /quizzes/:id — update | DELETE /quizzes/:id — delete | PATCH /quizzes/:id/link — link to course/chapter | POST /quizzes/:id/assign — assign to users | GET /quizzes/:id/attempts/current — current attempt | POST /quizzes/:id/attempts — start attempt | POST /quizzes/attempts/:attemptId/answers — submit answer | POST /quizzes/attempts/:attemptId/submit — submit attempt | PATCH /quizzes/answers/:answerId/grade — grade essay

### Progress
- GET /progress/:chapterId — get progress | PATCH /progress/:chapterId — update | POST /progress/:chapterId/complete — mark complete

## Frontend Pages & Components

- **Courses:** CoursesPage, CourseDetailPage, CourseForm, CreateCourseForm, EditCourseForm, CreateChapterForm, EditChapterForm, ChapterContent, ChapterSidebar, CoursePlayerPage, CourseQuizManagePage.
- **Enrollments:** EnrollmentsPage, EnrollmentDetailPage, EditEnrollmentPage, AssignCourseDialog.
- **Quizzes:** QuizzesPage, QuizDetailPage, CreateQuizPage, EditQuizPage, QuizAttemptPage, QuizForm, QuestionForm, OptionForm, QuizPlayer (in courses).
- **Hooks:** useCourses, useChapters, useEnrollments, useQuizAttempt, useQuizzes.
- **Services:** courseService, chapterService, progressService, enrollmentService, quizService.

Routes: /courses, /courses/:id, course player and quiz attempt routes; /enrollments; /quizzes (list, create, edit, detail, attempt).

## Dependencies

- **Backend:** Prisma (Course, Chapter, Enrollment, Quiz, Question, Option, Attempt, Answer, Progress, User), Mail for assignment notifications, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass, DataScopeGuard on enrollments where applied.
- **Frontend:** Auth, core API. Course player and progress depend on enrollment and progress APIs.

## Functional Requirements

- [FR-1] The system must support full CRUD for courses, including status management (DRAFT, PUBLISHED) and slug-based access.
- [FR-2] The system must support full CRUD for chapters, bulk reorder within a course, and a public read endpoint for unauthenticated chapter browsing.
- [FR-3] The system must support enrollment creation, admin assignment of courses to users, and listing enrollments with optional data-scope filtering (SELF/DEPARTMENT/SUPER).
- [FR-4] The system must provide a learning context endpoint (`GET /enrollments/:id/learning-context`) returning course, ordered chapters, and per-chapter progress for the enrolled user.
- [FR-5] The system must track chapter progress per enrollment, allow progress updates, and allow marking chapters complete.
- [FR-6] The system must support full CRUD for quizzes and linking quizzes to courses or chapters.
- [FR-7] The system must support quiz attempts: start, submit answer per question, submit the full attempt, and manual grading of essay answers.
- [FR-8] List endpoints for courses, chapters, enrollments, and quizzes must support `options=true` bypass for dropdown use.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Enrollment list must respect the user's `dataLevel` (SELF/DEPARTMENT/SUPER) via `DataScopeGuard` where implemented.
- [NFR-3] All write operations must require a valid JWT and the corresponding permission.
- [NFR-4] Permission checks must be enforced via `PermissionsGuard` on all non-public endpoints; chapter public-browsing endpoint is exempt.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.
- [NFR-7] Course assignment must trigger an email notification to the enrolled user via the mail service.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | Admin creates a course with status DRAFT and then publishes it | Course accessible via slug after publishing; DRAFT course not visible to public chapter endpoint |
| AC-2 | Admin assigns a course to a user | Enrollment record created; user sees course in `GET /enrollments/user`; assignment email sent |
| AC-3 | Learner completes a chapter | `POST /progress/:chapterId/complete` returns 200; `GET /enrollments/:id/learning-context` reflects completion |
| AC-4 | Learner starts a quiz attempt, submits answers, and submits attempt | Attempt recorded; result calculated; `GET :id/attempts/current` returns nil after submission |
| AC-5 | Instructor grades essay answer | `PATCH /quizzes/answers/:answerId/grade` returns 200; grade recorded |
| AC-6 | DEPARTMENT-scoped user lists enrollments | Only enrollments from the user's department returned |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and data-scope enforcement
- [`prd-notifications.md`](prd-notifications.md) — notification and email delivery system used for course assignment
