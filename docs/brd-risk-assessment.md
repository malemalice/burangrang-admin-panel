# Business Requirements Document (BRD)
## Risk Assessment Management System

**Document Version:** 1.0  
**Date:** October 26, 2025  
**Project:** BSJ Admin Panel - HSE Dashboard  
**Module:** Risk Assessment

---

## 1. Executive Summary

The Risk Assessment Management System enables systematic identification, evaluation, and mitigation of workplace risks across organizational departments. The system supports pre-assessment and post-assessment risk calculations using a standardized risk matrix methodology.

---

## 2. Business Objectives

- **Objective 1:** Standardize risk assessment processes across all departments
- **Objective 2:** Enable proactive risk identification and mitigation planning
- **Objective 3:** Maintain compliance with HSE regulations and audit requirements
- **Objective 4:** Provide visibility into risk status through approval workflows

---

## 3. Stakeholders & User Roles

| Role | Responsibility |
|------|----------------|
| **Risk Assessor** | Creates and manages risk assessment records |
| **Department Head** | Reviews and assigns risk assessments within department |
| **HSE Officer** | Validates risk ratings and mitigation strategies |
| **Approver** | Reviews and approves completed assessments per approval workflow |
| **Assignee** | Executes action plans and implements risk controls |

---

## 4. Functional Requirements

### 4.1 Risk Assessment Creation

**FR-01:** System shall allow users to create risk assessments with:
- Unique code generation
- Department assignment
- Assessment date
- Description and action plan
- Status tracking (SCHEDULED, DRAFT, OPEN, WAITING_APPROVAL, DONE, REJECTED)

**FR-02:** System shall support assignment to specific users for action execution

### 4.2 Risk Assessment Items

**FR-03:** Each assessment shall contain multiple risk items with:
- HSE category selection from master data
- Threat selection (filtered by HSE category)
- Custom threat description
- Pre-assessment risk evaluation:
  - Likelihood level (1-5)
  - Consequence level (1-5)
  - Auto-calculated risk rating (LOW, MEDIUM, HIGH, EXTREME)
  - Risk interpretation
- Post-assessment risk evaluation (after mitigation):
  - Post-likelihood level
  - Post-consequence level
  - Post-risk rating
  - Post-interpretation

**FR-04:** Risk ratings shall be automatically calculated using risk matrix lookup table based on likelihood × consequence levels

### 4.3 Risk Control Measures

**FR-05:** Each risk item shall have associated control measures following hierarchy of controls:
- **Eliminate:** Remove the hazard entirely
- **Transfer:** Shift risk to third party
- **Reduce:** Implement controls to minimize impact
- **Accept:** Document acceptance of residual risk with justification

**FR-06:** Risk controls shall track:
- Open/closed status
- Acceptance flag
- Active status for audit trail

### 4.4 Workflow Management

**FR-07:** Risk assessments shall progress through defined statuses:
```
DRAFT → OPEN → WAITING_APPROVAL → DONE
         ↓
      REJECTED (with notes) → OPEN (for revision)
```

**FR-08:** System shall integrate with approval workflow system based on:
- Department hierarchy
- Job position levels
- Configurable approval chains

### 4.5 Reporting & Analytics

**FR-09:** System shall provide views for:
- Risk assessment dashboard by department
- Risk rating distribution (pre/post mitigation)
- Outstanding action items by assignee
- Approval pending queue
- Historical assessment trends

---

## 5. Business Rules

**BR-01:** Risk rating calculation follows standard matrix: `RiskRating = f(Likelihood, Consequence)`

**BR-02:** Post-assessment risk must be equal to or lower than pre-assessment risk

**BR-03:** All risk items must have at least one control measure defined

**BR-04:** Assessments in DONE status cannot be modified (create new version instead)

**BR-05:** Only assessments in OPEN status can be submitted for approval

**BR-06:** Risk assessments must be reviewed annually (configurable period)

**BR-07:** Users can only create assessments for their assigned department (unless admin role)

**BR-08:** Risk acceptance requires management approval for HIGH and EXTREME ratings

---

## 6. Data Requirements

### 6.1 Master Data Dependencies

- **m_departments:** Organizational departments
- **m_hse_categories:** HSE category classifications
- **m_threats:** Threat definitions per HSE category
- **m_risk_matrix:** Likelihood × Consequence matrix with ratings
- **m_job_positions:** Job hierarchy for approval routing
- **t_users:** User accounts and roles

### 6.2 Data Retention

- Active assessments: Indefinite
- Historical assessments: Minimum 7 years (compliance requirement)
- Audit trail: All changes logged with timestamp and user

---

## 7. Integration Requirements

**INT-01:** Integration with Approval System for workflow management

**INT-02:** Integration with User Management for role-based access control

**INT-03:** Integration with Notification System for:
- Assignment notifications
- Approval requests
- Deadline reminders
- Status change alerts

**INT-04:** Future: Integration with Incident Reporting for risk-incident correlation analysis

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Risk matrix calculation < 100ms per item |
| **Usability** | Max 3 clicks to create new assessment item |
| **Security** | Role-based access; department data isolation |
| **Availability** | 99.5% uptime during business hours |
| **Auditability** | Complete change history with user attribution |

---

## 9. Success Criteria

1. **Adoption Rate:** 90% of departments conduct quarterly risk assessments within 6 months
2. **Risk Mitigation:** 80% of identified HIGH/EXTREME risks reduced to MEDIUM/LOW within action plan timeline
3. **Compliance:** 100% of risk assessments approved within defined SLA
4. **User Satisfaction:** Average user rating ≥ 4/5 for system usability

---

## 10. Assumptions & Constraints

### Assumptions
- Users have basic understanding of risk assessment methodology
- HSE categories and threats are pre-configured before system launch
- Approval workflows are defined at organizational level

### Constraints
- Must comply with ISO 31000 risk management standards
- System must support offline data collection (future phase)
- Budget constraints limit advanced analytics features to Phase 2

---

## 11. Out of Scope (Current Phase)

- Automated risk assessment using AI/ML
- Mobile application for field assessments
- Real-time IoT sensor integration for risk monitoring
- Advanced predictive analytics and trend forecasting
- Multi-language support (English only in Phase 1)

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **HSE** | Health, Safety, and Environment |
| **Likelihood** | Probability of risk occurrence (scale 1-5) |
| **Consequence** | Impact severity if risk occurs (scale 1-5) |
| **Risk Rating** | Combined measure: LOW, MEDIUM, HIGH, EXTREME |
| **Control Measure** | Action taken to eliminate or reduce risk |
| **Residual Risk** | Post-mitigation risk level after controls applied |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Owner | _______________ | _______________ | ______ |
| HSE Manager | _______________ | _______________ | ______ |
| IT Manager | _______________ | _______________ | ______ |
| Project Manager | _______________ | _______________ | ______ |

---

**END OF DOCUMENT**

