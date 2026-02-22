# ERD Quick Reference Guide

## Core Entities & Relationships

### User Management
- **User** (id, email, firstName, lastName, isActive, roleId, officeId, departmentId?, jobPositionId?, password?)
- **Role** (id, name, description, isActive) ↔ **Permission** (many-to-many)
- **User** → **Role** (required), **Office** (required), **Department** (optional), **JobPosition** (optional)
- **PasswordResetToken** (id, token, userId, email, expiresAt, isUsed)

### Organizational Structure
- **Office** (id, name, code, parentId?) - Self-referencing hierarchy
- **Department** (id, name, code, description, emails?) - emails is JSON array
- **JobPosition** (id, name, code, level, description)

### Reference Data
- **AchievementRate** (id, name, code, rangeMin, rangeMax, description, isActive)

### Learning Management System (LMS)
- **Course** (id, title, slug, description, thumbnailUrl, totalChapters, totalDuration, difficulty, language, rating, reviewCount, studentCount, instructorId, status, isPublished, publishedAt, isActive)
- **Chapter** (id, courseId, title, description, order, duration, contentType, contentUrl, youtubeVideoId, content, isFree, isPublished, publishedAt, isActive)
- **Enrollment** (id, userId, courseId, orderId?, status, enrolledAt, completedAt?, progress, lastAccessedAt?)
- **Progress** (id, enrollmentId, chapterId, status, timeSpent, progress, startedAt?, completedAt?, lastAccessedAt?)
- **Quiz** (id, courseId?, chapterId?, title, description, instructions, duration?, passingScore, maxAttempts?, shuffleQuestions, shuffleOptions, showCorrectAnswer, isPublished, publishedAt?, isActive, createdBy)
- **QuizQuestion** (id, quizId, questionType, questionText, explanation?, mediaUrl?, mediaType?, points, order, isActive)
- **QuizQuestionOption** (id, questionId, optionText, isCorrect, order)
- **QuizAttempt** (id, quizId, enrollmentId, attemptNumber, status, score?, totalPoints?, earnedPoints?, isPassed, dueDate?, startedAt, completedAt?, timeSpent)
- **QuizAttemptStatus** enum: INVITING, INVITED, IN_PROGRESS, COMPLETED, ABANDONED
- **QuizAnswer** (id, attemptId, questionId, selectedOptionId?, essayAnswer?, isCorrect?, pointsEarned, feedback?, gradedBy?, gradedAt?)
- **Course** → **User** (instructor, required)
- **Quiz** → **Course** (optional) or **Chapter** (optional) - can be bound to either
- **Enrollment** → **User**, **Course** (required), **Order** (optional)
- **Progress** → **Enrollment**, **Chapter** (required)
- **QuizAttempt** → **Quiz**, **Enrollment** (required)
- **QuizAnswer** → **QuizAttempt**, **QuizQuestion**, **QuizQuestionOption** (optional), **User** (grader, optional)

### Certificate Management System
- **CertificateCategory** (id, name, code, certificateType, description, isActive)
- **CertificateTypeEnum**: PERSONNEL_LICENSE, PERSONNEL_CERTIFICATE, EQUIPMENT_CALIBRATION, EQUIPMENT_INSTALLATION, EQUIPMENT_OPERATIONAL_PERMIT
- **Certificate** (id, certificateNumber, certificateName, categoryId, issuedDate, validityDate, issuerName, documentUrl, personnelId?, personnelName?, equipmentId?, equipmentName?, departmentId, reminderDays, notes, isActive, createdBy)
- **CertificateRenewal** (id, certificateId, requestDate, requestedBy, status, processedBy?, processedDate?, newValidityDate?, newDocumentUrl?, notes)
- **CertificateRenewalStatusEnum**: PENDING, REQUESTED, IN_PROGRESS, COMPLETED, REJECTED, EXPIRED
- **CertificateReminder** (id, certificateId, reminderDate, isSent, sentAt?, recipientId)
- **Certificate** → **CertificateCategory** (required), **User** (personnel, optional), **Equipment** (optional), **Department** (required), **User** (creator, required)
- **CertificateRenewal** → **Certificate** (required), **User** (requester, required), **User** (processor, optional)
- **CertificateReminder** → **Certificate** (required), **User** (recipient, required)

### Navigation & Access
- **Menu** (id, name, path, icon, parentId?, order) - Self-referencing hierarchy
- **Role** ↔ **Menu** (many-to-many)

### Approval System
- **MasterApproval** (id, entity, isActive) → **MasterApprovalItem** (id, order, job_position_id, department_id, createdBy)
- **Approval** (id, entityId, status, notes, department_id, job_position_id, createdBy)

### HSE Management
- **HseCategory** (id, name, code, description, isActive)
- **Threat** (id, name, code, description, hseCategoryId, isActive)
- **ThreatMitigation** (id, level, mitigationDescription, threatId, isActive)
- **SafetyEquipment** (id, name, code, description, category, isActive)
- **SafetyEquipmentCategoryEnum**: PERSONAL_PROTECTIVE_EQUIPMENT, SAFETY_AND_EMERGENCY_EQUIPMENT

### Inspection System
- **Area** (id, name, code, description, officeId?, isActive)
- **Inspection** (id, code, inspectorId, areaId, inspectionDate, hseCategoryId, findingIssue, description, assignedDepartmentId, assigneeId?, controlMeasure, followUpNotes, status, isActive, createdBy)
- **InspectionPhoto** (id, inspectionId, photoUrl, caption, order)
- **Inspection** ↔ **User** (many-to-many for multiple inspectors)

### Audit System
- **AuditCriteria** (id, name, code, description, isActive)
- **AuditCriteriaGroup** (id, name, code, description, criteriaId, order, isActive)
- **AuditCriteriaItem** (id, name, code, description, criteriaGroupId, order, isActive)
- **Audit** (id, code, areaId, auditDate, criteriaId, assignedDepartmentId, assigneeId?, controlMeasure, followUpNotes, status, isActive, createdBy)
- **AuditItem** (id, auditId, criteriaItemId, isCompliant, finding, recommendation, order)
- **AuditImage** (id, auditId, imageUrl, caption, order)
- **Audit** ↔ **User** (many-to-many for multiple auditors)

### Accident Report System
- **AccidentReport** (id, code, accidentDate, areaId, accidentClassification, reportedBy, controlMeasure, dueDate, expectedOutcome, assignedDepartmentId, assigneeId?, status, source, isActive, createdBy)
- **AccidentReportImage** (id, accidentReportId, imageUrl, caption, order)
- **AccidentClassificationEnum**: MAJOR, MINOR, FATALITY
- **SourceEnum**: SYSTEM, ZOHO

### Work Permit System
- **ProjectType** (id, name, code, description, isActive)
- **Equipment** (id, name, code, description, isActive)
- **Tool** (id, name, code, description, isActive)
- **Material** (id, name, code, description, isActive)
- **Machine** (id, name, code, description, isActive)
- **Company** (id, name, code, address, contactPerson, phone, email, isActive)
- **Profession** (id, name, code, description, isActive)
- **Guest** (id, name, email?, phone?, photoUrl?, isActive)
- **WorkPermit** (id, code, projectName, projectTypeId, areaId, bsjPicId?, bsjPicName?, companyId, proposedStartDate, proposedEndDate, workStagesDescription, jobSafetyAnalysis, workRequirements?, safetyGuideline?, status, isActive, createdBy)
- **WorkPermitEquipment** (id, workPermitId, equipmentId, quantity, order)
- **WorkPermitTool** (id, workPermitId, toolId, quantity, order)
- **WorkPermitMaterial** (id, workPermitId, materialId, quantity, order)
- **WorkPermitMachine** (id, workPermitId, machineId, quantity, order)
- **WorkPermitProfession** (id, workPermitId, professionId, quantity, order)
- **WorkPermitWorker** (id, workPermitId, guestId, idNumber?, certificateUrl?, healthDeclarationUrl, order)
- **WorkPermit** ↔ **Guest** (many-to-many for supervisors)
- **WorkPermit** ↔ **User** (many-to-many for HSE Officers)
- **WorkPermit** ↔ **SafetyEquipment** (many-to-many for safety equipment)

### Risk Assessment
- **RiskMatrix** (id, likelihoodLevel, consequenceLevel, interpretation)
- **RiskAssessment** (id, code, description, departmentId, assessmentDate, createdBy, status, assigneeId?, actionPlan?)
- **RiskAssessmentItem** (id, riskAssessmentId, mThreatId, mHseCategoryId, likelihoodLevel, consequenceLevel, riskMatrixRating)

### Notification System
- **NotificationType** (id, name, description, isActive)
- **Notification** (id, title, message, context, contextId, typeId, isRead, createdBy)
- **NotificationRecipient** (id, notificationId, roleId, userId?, isRead, readAt)

### File Upload System
- **FileStorageProvider** (id, name, config, isActive, isDefault)
- **FileCategory** (id, name, allowedTypes, maxSize, isActive)
- **FileUpload** (id, originalName, storedName, mimeType, size, hash, storageProviderId, categoryId, uploadedBy, isPublic, accessToken)
- **FileAccessLog** (id, fileId, accessedBy?, ipAddress, userAgent, accessType, accessedAt)

### System
- **Setting** (id, key, value, isActive)
- **RefreshToken** (id, token, userId, expiresAt)

## Key Patterns

### Hierarchical Entities
- **Office**: Parent-child office structure
- **Menu**: Parent-child navigation structure

### Many-to-Many
- **Role ↔ Permission**: Role-based permissions
- **Role ↔ Menu**: Role-based menu access

### Optional Relationships
- User.departmentId (nullable)
- User.jobPositionId (nullable)

### Audit Fields
- All entities: createdAt, updatedAt
- Approval entities: createdBy (tracks creator)

## Common Query Patterns

```typescript
// User with all relationships
prisma.user.findUnique({
  where: { id },
  include: { role: true, office: true, department: true, jobPosition: true }
})

// Active users in office hierarchy
prisma.user.findMany({
  where: {
    isActive: true,
    office: { OR: [{ id: officeId }, { parentId: officeId }] }
  }
})

// Role-accessible menus
prisma.menu.findMany({
  where: {
    isActive: true,
    roles: { some: { id: roleId } }
  },
  orderBy: { order: 'asc' }
})

// Audit with all relationships
prisma.audit.findUnique({
  where: { id },
  include: {
    area: true,
    criteria: true,
    auditors: { include: { user: true } },
    assignedDepartment: true,
    assignee: true,
    items: {
      include: { criteriaItem: { include: { criteriaGroup: true } } }
    },
    images: { orderBy: { order: 'asc' } }
  }
})

// Active criteria with groups and items hierarchy
prisma.auditCriteria.findMany({
  where: { isActive: true },
  include: {
    groups: {
      where: { isActive: true },
      include: {
        items: { where: { isActive: true }, orderBy: { order: 'asc' } }
      },
      orderBy: { order: 'asc' }
    }
  }
})

// Find achievement rate by score
const score = 85.5; // percentage score
prisma.achievementRate.findFirst({
  where: {
    isActive: true,
    rangeMin: { lte: score },
    rangeMax: { gte: score }
  }
})

// Get all active achievement rate ranges
prisma.achievementRate.findMany({
  where: { isActive: true },
  orderBy: { rangeMin: 'desc' } // Order from highest to lowest
})

// Accident report with all relationships
prisma.accidentReport.findUnique({
  where: { id },
  include: {
    area: true,
    reportedByUser: true,
    assignedDepartment: true,
    assignee: true,
    createdByUser: true,
    images: { orderBy: { order: 'asc' } }
  }
})

// Active accident reports by classification
prisma.accidentReport.findMany({
  where: {
    isActive: true,
    accidentClassification: 'MAJOR',
    status: { in: ['OPEN', 'WAITING_APPROVAL'] }
  },
  include: { area: true, assignedDepartment: true }
})

// Work permit with all relationships
prisma.workPermit.findUnique({
  where: { id },
  include: {
    projectType: true,
    area: true,
    bsjPic: true,
    company: true,
    hseOfficers: { include: { user: true } },
    supervisors: { include: { guest: true } },
    safetyEquipment: { include: { safetyEquipment: true } },
    equipment: { 
      include: { equipment: true },
      orderBy: { order: 'asc' }
    },
    tools: { 
      include: { tool: true },
      orderBy: { order: 'asc' }
    },
    materials: { 
      include: { material: true },
      orderBy: { order: 'asc' }
    },
    machines: { 
      include: { machine: true },
      orderBy: { order: 'asc' }
    },
    professions: {
      include: { profession: true },
      orderBy: { order: 'asc' }
    },
    workers: {
      include: { guest: true },
      orderBy: { order: 'asc' }
    },
    createdByUser: true
  }
})

// Active work permits by status
prisma.workPermit.findMany({
  where: {
    isActive: true,
    status: { in: ['OPEN', 'WAITING_APPROVAL'] },
    proposedStartDate: { gte: new Date() }
  },
  include: { projectType: true, area: true, company: true }
})

// Course with all relationships
prisma.course.findUnique({
  where: { id },
  include: {
    instructor: true,
    chapters: {
      where: { isPublished: true, isActive: true },
      orderBy: { order: 'asc' }
    },
    quizzes: {
      where: { isPublished: true, isActive: true }
    },
    categories: true
  }
})

// Active published courses
prisma.course.findMany({
  where: {
    isActive: true,
    isPublished: true,
    status: 'published'
  },
  include: { instructor: true, categories: true },
  orderBy: { publishedAt: 'desc' }
})

// User enrollment with progress
prisma.enrollment.findFirst({
  where: {
    userId,
    courseId,
    status: 'ACTIVE'
  },
  include: {
    course: { include: { instructor: true, chapters: true } },
    progressRecords: {
      include: { chapter: true },
      orderBy: { chapter: { order: 'asc' } }
    }
  }
})

// Quiz with all questions and options
prisma.quiz.findUnique({
  where: { id },
  include: {
    course: true,
    chapter: true,
    createdByUser: true,
    questions: {
      where: { isActive: true },
      include: {
        options: { orderBy: { order: 'asc' } }
      },
      orderBy: { order: 'asc' }
    }
  }
})

// Start a new quiz attempt
const lastAttempt = await prisma.quizAttempt.findFirst({
  where: { enrollmentId, quizId },
  orderBy: { attemptNumber: 'desc' }
});

const newAttempt = await prisma.quizAttempt.create({
  data: {
    quizId,
    enrollmentId,
    attemptNumber: (lastAttempt?.attemptNumber || 0) + 1,
    status: 'IN_PROGRESS',
    startedAt: new Date()
  }
});

// Get quiz attempt with all answers
prisma.quizAttempt.findUnique({
  where: { id },
  include: {
    quiz: {
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    },
    enrollment: { include: { user: true } },
    answers: {
      include: {
        question: { include: { options: true } },
        selectedOption: true,
        grader: true
      }
    }
  }
})

// Submit and grade multiple choice answer
await prisma.quizAnswer.create({
  data: {
    attemptId,
    questionId,
    selectedOptionId,
    isCorrect: selectedOption.isCorrect,
    pointsEarned: selectedOption.isCorrect ? question.points : 0
  }
})

// Submit essay answer (requires manual grading)
await prisma.quizAnswer.create({
  data: {
    attemptId,
    questionId,
    essayAnswer: studentAnswer,
    isCorrect: null, // Will be set by instructor
    pointsEarned: 0 // Will be updated after grading
  }
})

// Grade essay answer
await prisma.quizAnswer.update({
  where: { id },
  data: {
    isCorrect: isCorrect,
    pointsEarned: points,
    feedback: instructorFeedback,
    gradedBy: instructorId,
    gradedAt: new Date()
  }
})

// Complete quiz attempt and calculate score
const answers = await prisma.quizAnswer.findMany({
  where: { attemptId },
  include: { question: true }
});

const totalPoints = answers.reduce((sum, a) => sum + Number(a.question.points), 0);
const earnedPoints = answers.reduce((sum, a) => sum + Number(a.pointsEarned), 0);
const score = (earnedPoints / totalPoints) * 100;

await prisma.quizAttempt.update({
  where: { id: attemptId },
  data: {
    status: 'COMPLETED',
    completedAt: new Date(),
    totalPoints,
    earnedPoints,
    score,
    isPassed: score >= quiz.passingScore,
    timeSpent: Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)
  }
})

// Get student's quiz history
prisma.quizAttempt.findMany({
  where: {
    enrollment: { userId },
    quizId
  },
  include: {
    quiz: true,
    answers: { include: { question: true } }
  },
  orderBy: { attemptNumber: 'desc' }
})

// Get pending essay answers for grading
prisma.quizAnswer.findMany({
  where: {
    isCorrect: null, // Essays not yet graded
    question: { questionType: 'ESSAY' }
  },
  include: {
    attempt: {
      include: {
        enrollment: { include: { user: true } },
        quiz: true
      }
    },
    question: true
  }
})

// Certificate with all relationships
prisma.certificate.findUnique({
  where: { id },
  include: {
    category: true,
    personnel: true, // User if personnelId is set
    equipment: true, // Equipment if equipmentId is set
    department: true,
    createdByUser: true,
    renewals: {
      include: {
        requestedByUser: true,
        processedByUser: true
      },
      orderBy: { requestDate: 'desc' }
    },
    reminders: {
      include: { recipient: true },
      orderBy: { reminderDate: 'desc' }
    }
  }
})

// Get expiring certificates (within 30 days)
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

prisma.certificate.findMany({
  where: {
    isActive: true,
    validityDate: {
      lte: thirtyDaysFromNow,
      gte: new Date()
    }
  },
  include: {
    category: true,
    department: true,
    personnel: true,
    equipment: true
  },
  orderBy: { validityDate: 'asc' }
})

// Get certificates by type
prisma.certificate.findMany({
  where: {
    isActive: true,
    certificateType: 'PERSONNEL_LICENSE', // or other types
    departmentId: departmentId
  },
  include: {
    category: true,
    personnel: true
  }
})

// Create certificate renewal request
await prisma.certificateRenewal.create({
  data: {
    certificateId: certificateId,
    requestedBy: userId,
    status: 'REQUESTED',
    notes: 'Renewal requested by department head'
  }
})

// Complete certificate renewal
await prisma.$transaction([
  // Update renewal record
  prisma.certificateRenewal.update({
    where: { id: renewalId },
    data: {
      status: 'COMPLETED',
      processedBy: processedByUserId,
      processedDate: new Date(),
      newValidityDate: newValidityDate,
      newDocumentUrl: documentUrl
    }
  }),
  // Update certificate with new validity date
  prisma.certificate.update({
    where: { id: certificateId },
    data: {
      validityDate: newValidityDate,
      documentUrl: documentUrl
    }
  })
])

// Get certificates needing renewal reminders
prisma.certificate.findMany({
  where: {
    isActive: true,
    validityDate: {
      lte: new Date(Date.now() + reminderDays * 24 * 60 * 60 * 1000)
    },
    reminders: {
      none: {
        reminderDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // No reminder in last 7 days
        }
      }
    }
  },
  include: {
    department: { include: { users: true } },
    category: true
  }
})
```

## Table Naming Convention
- **Master Data Tables**: Prefixed with `m_` (m_roles, m_permissions, m_offices, m_departments, m_job_positions, m_menus, m_settings, m_approval, m_approval_item, m_hse_categories, m_threats, m_threat_mitigations, m_risk_matrix, m_notification_types, m_file_storage_providers, m_file_categories, m_areas, m_audit_criteria, m_audit_criteria_group, m_audit_criteria_item, m_achievement_rates, m_project_types, m_equipment, m_tools, m_materials, m_machines, m_companies, m_professions, m_guests, m_safety_equipment, m_certificate_categories)
- **Transactional Data Tables**: Prefixed with `t_` (t_users, t_refresh_tokens, t_password_reset_tokens, t_approvals, t_risk_assessment, t_risk_assessment_item, t_notifications, t_notification_recipients, t_file_uploads, t_file_access_logs, t_inspections, t_inspection_photos, t_audits, t_audit_items, t_audit_images, t_accident_reports, t_accident_report_images, t_work_permits, t_work_permit_equipment, t_work_permit_tools, t_work_permit_materials, t_work_permit_machines, t_work_permit_workers, t_work_permit_professions, t_courses, t_chapters, t_enrollments, t_progress, t_quizzes, t_quiz_questions, t_quiz_question_options, t_quiz_attempts, t_quiz_answers, t_certificates, t_certificate_renewals, t_certificate_reminders)
- **Junction Tables**: Prisma default naming (_PermissionToRole, _MenuToRole, _InspectionToUser, _AuditToUser, _WorkPermitSupervisorToGuest, _WorkPermitToUser, _WorkPermitToSafetyEquipment)

## Constraints
- All PKs: UUID
- Unique: email, role.name, permission.name, office.code, dept.code, job.code, hse_category.code, threat.code, risk_assessment.code, notification_type.name, file_storage_provider.name, file_category.name, file_upload.accessToken, setting.key, tokens (refresh & reset), area.code, inspection.code, audit.code, audit_criteria.code, audit_criteria_group.code, audit_criteria_item.code, achievement_rate.code, accident_report.code, project_type.code, equipment.code, tool.code, material.code, machine.code, company.code, profession.code, work_permit.code, safety_equipment.code, course.slug, certificate_category.code
- FK Actions: UPDATE CASCADE, DELETE RESTRICT (or SET NULL for optional)
- Composite Unique: notification_recipients[notificationId, roleId, userId], progress[enrollmentId, chapterId], quiz_answers[attemptId, questionId]

## AI Guidelines
1. Always include related entities in queries (especially for User: role, office, department?, jobPosition?)
2. Check for null optional fields (departmentId, jobPositionId, assigneeId, userId in notifications, password)
3. Filter by isActive for active records (applies to most entities)
4. Respect hierarchical relationships (Office, Menu have parent-child structure; Audit: criteria → group → item)
5. Use proper Prisma include/select patterns
6. For risk assessments: always include department, items with threats and categories
7. For notifications: filter by roleId or userId in recipients
8. For file uploads: check category allowedTypes and maxSize before upload
9. For password reset: verify token expiration and isUsed flag
10. Consider cascading deletes for notification recipients and file access logs
11. For inspections: always include inspector, area, hseCategory, assignedDepartment, assignee, and photos
12. Inspection status flow: SCHEDULED → DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
13. For audits: always include auditors (via junction), area, criteria, items with criteriaItem, assignedDepartment, assignee, and images
14. Audit status flow: SCHEDULED → DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
15. Audit hierarchy: Criteria (top) → Criteria Group (middle) → Criteria Item (bottom/checklist)
16. Audit items track compliance (CompliantStatusEnum: COMPLY, NOT_COMPLY_MAJOR, NOT_COMPLY_MINOR) with evidence and recommendations
17. Achievement rates define percentage ranges (rangeMin to rangeMax) for categorizing performance levels
18. Use achievement rates to classify audit/inspection/assessment scores into categories (Excellent, Good, Fair, etc.)
19. For accident reports: always include reportedBy, area, assignedDepartment, assignee, createdBy, and images
20. Accident classification (AccidentClassificationEnum: MAJOR, MINOR, FATALITY) determines severity level
21. Accident report status flow: DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
22. Source field tracks origin: SYSTEM (created in app) or ZOHO (imported from external system)
23. For work permits: always include projectType, area, company, bsjPic (optional), hseOfficers, supervisors, equipment, tools, materials, machines, professions, workers, and createdBy
24. Work permit status flow: DRAFT → OPEN → WAITING_APPROVAL → DONE/REJECTED
25. BSJ PIC can be from user list (bsjPicId) or free text (bsjPicName) - check both fields
26. Supervisors are multiple guests via junction table (_WorkPermitSupervisorToGuest)
27. HSE Officers are multiple users via junction table (_WorkPermitToUser)
28. Equipment, tools, materials, and machines lists track quantity per item with order for display sequence
29. Workers are guests with optional idNumber, certificates (certificateUrl), and required healthDeclarationUrl
30. Guests have optional email and phone - check for null before use
31. Companies can be inserted dynamically if not in master list
32. Project types, equipment, tools, materials, and machines can be inserted dynamically if not in master list
33. Professions track required workforce composition for work permits (e.g., 2 Surveyors, 10 Engineers) with quantity per profession
34. For work permits: always include professions list with quantities when displaying or creating permits
35. Safety equipment can be assigned to work permits via many-to-many relationship without additional columns
36. Safety equipment categories: PERSONAL_PROTECTIVE_EQUIPMENT (PPE like helmets, gloves) and SAFETY_AND_EMERGENCY_EQUIPMENT (fire extinguishers, first aid kits)
37. For courses: always include instructor, chapters, and categories when displaying course details
38. Course status flow: DRAFT → REVIEW → PUBLISHED → ARCHIVED
39. Course difficulty levels: BEGINNER, INTERMEDIATE, ADVANCED
40. For quizzes: can be bound to either a Course (courseId) or Chapter (chapterId), but not both
41. Quiz question types: MULTIPLE_CHOICE, ESSAY, TRUE_FALSE
42. Quiz questions support multimedia: image, video, audio, document via mediaUrl and mediaType
43. Quiz attempts track status (QuizAttemptStatus enum): INVITING (preparing invitation), INVITED (invitation sent, not started), IN_PROGRESS (actively taking quiz), COMPLETED (finished), ABANDONED (started but not finished)
43a. Quiz attempts can have optional dueDate for deadline enforcement
44. Quiz answers for essays (isCorrect = null) require manual grading by instructor (gradedBy field)
45. Multiple choice and true/false answers are auto-graded on submission
46. For enrollments: users can re-enroll after completion, but only one ACTIVE enrollment per course at a time
47. Enrollment status: ACTIVE, COMPLETED, CANCELLED, EXPIRED
48. Progress status: NOT_STARTED, IN_PROGRESS, COMPLETED
49. Progress tracks both chapter-level and overall course completion
50. Quiz passingScore is percentage (default 75%), maxAttempts null = unlimited retakes
51. For quiz attempts: always include quiz, enrollment, and answers with questions and options
52. Quiz features: shuffleQuestions, shuffleOptions, showCorrectAnswer (configurable per quiz)
53. QuizAttempt tracks attemptNumber, score, totalPoints, earnedPoints, timeSpent (in seconds), and isPassed flag
54. For certificates: always include category, department, personnel/equipment info, createdBy, and renewals when displaying
55. Certificate types: PERSONNEL_LICENSE, PERSONNEL_CERTIFICATE (for staff), EQUIPMENT_CALIBRATION, EQUIPMENT_INSTALLATION, EQUIPMENT_OPERATIONAL_PERMIT (for equipment)
56. Certificates can reference personnel via userId (personnelId) OR free-text name (personnelName) - check both fields
57. Certificates can reference equipment via equipmentId OR free-text name (equipmentName) - check both fields
58. Certificate renewal workflow: Head of Dept → Human Capital (personnel) or Procurement (equipment) → Update certificate
59. Certificate renewal status: PENDING (awaiting action), REQUESTED (sent to HC/Procurement), IN_PROGRESS, COMPLETED, REJECTED, EXPIRED
60. Reminders should be sent based on reminderDays field (default 30 days before expiry)
61. Certificate reminders track: reminderDate, isSent flag, sentAt timestamp, and recipient (department head/line manager)
62. When completing renewal: update both CertificateRenewal record AND Certificate.validityDate in a transaction
63. Filter expired certificates: validityDate < current date
64. Filter expiring soon: validityDate between now and (now + reminderDays)
65. Certificate categories define the type of certificate and help with classification and reporting
