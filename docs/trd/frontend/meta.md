> [← Frontend TRD Index](./index.md)

> This file bundles short meta sections originally found in `frontend/TRD.md`: Module Development Metrics, Next Steps, Success Metrics, Benefits, References, Document History.

## 📊 Module Development Metrics

### Quality Gates
- **Test Coverage**: > 80% for all modules
- **TypeScript Compliance**: 100% type safety
- **Performance Budget**: < 100KB bundle per module
- **Accessibility Score**: > 90 on Lighthouse
- **SEO Score**: > 85 on Lighthouse (where applicable)

### Code Review Checklist
- [ ] Module structure follows template
- [ ] All patterns are correctly implemented
- [ ] No circular dependencies
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] TypeScript types are complete
- [ ] Tests are included
- [ ] Documentation is updated

---

## 🎯 Next Steps

1. **Review Current Implementation**: Audit existing modules against these patterns
2. **Create Module Template**: Develop a Yeoman/generator for new modules
3. **Establish Linting Rules**: Create ESLint rules for pattern compliance
4. **Documentation Updates**: Keep this document synchronized with implementation
5. **Team Training**: Ensure all developers understand these patterns
6. **Continuous Improvement**: Regularly review and update patterns based on experience

---

## 📊 Success Metrics

### Code Quality Metrics
- [ ] **Cyclomatic Complexity**: < 10 per function
- [ ] **Coupling**: < 3 dependencies per module
- [ ] **Cohesion**: > 80% related functionality per module
- [ ] **Test Coverage**: > 90% for critical paths

### Developer Experience Metrics
- [ ] **Time to locate files**: < 30 seconds
- [ ] **Onboarding time**: < 2 days for new developers
- [ ] **Build time**: No significant increase
- [ ] **Bundle size**: No significant increase

### Maintainability Metrics
- [ ] **Module independence**: 100% of modules can be developed independently
- [ ] **Change impact**: < 2 modules affected per feature change
- [ ] **Code reuse**: > 60% of components are reusable

---

## 🎯 Benefits

### Immediate Benefits
- ✅ **Clear ownership**: Each module has defined boundaries
- ✅ **Easier navigation**: Related files are co-located
- ✅ **Reduced cognitive load**: Focus on one module at a time
- ✅ **Better testing**: Module-specific test organization

### Long-term Benefits
- ✅ **Scalability**: Easy to add new modules
- ✅ **Team collaboration**: Multiple developers can work independently
- ✅ **Code reusability**: Clear separation of shared vs module-specific code
- ✅ **Maintainability**: Changes isolated to specific modules
- ✅ **Micro-frontend ready**: Easy to extract modules if needed

---

## 📚 References

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Feature-Based Architecture](https://martinfowler.com/articles/feature-toggles.html)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 📝 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.12 | 2026-04-04 | Development Team | Added **PDF — Verification and approval section (digital)** under Advanced Features: data source (`ApprovalStatusHistory`), section structure (summary, workflow-by-step table, chronological log, empty state), layout for print capture. Updated PDF Export template structure bullet to reference this subsection. Reference: EnvironmentalMeasurementPDFTemplate, WeightReportPDFTemplate. |
| 1.11 | 2025-02-21 | Development Team | Added "Workflow Guideline UI — Principles for Creating Workflow Information" (item 9) under Document Workflow & Status Management Patterns. Workflow guidelines are dynamic: approval steps driven by Master Approval (fetch by entity, render items with sentinel labels, fallback if no config). Content/structure/UI principles as above. Reference: MasterApprovalForm, InspectionItemsPage. |
| 1.9 | 2025-02-03 | Development Team | Added "Options Bypass for Select/Dropdown Data" under Inter-Module API Calls and Cross-Module Data Dependencies: use `options: true` in query params when fetching list data for form dropdowns so users without the specific list permission can load options. Reference: UserForm, CertificateForm. |
| 1.8 | 2024-12-20 | Development Team | Added "PDF Export (Detail Page) — Implementation Principles" under Advanced Features: react-to-pdf, dedicated PDF template, full data fetch before capture, hidden target, data fallback, filename/UX, template structure. Reference: RiskAssessmentDetailPage, RiskAssessmentPDFTemplate. |
| 1.7 | 2024-12-20 | Development Team | Added "List page state persistence (index → view → back)" under Search & Filters: URL as source of truth for list state, derive state from useSearchParams, sync URL on list actions, Back uses navigate(-1). Reference: AuditResultsPage, RiskRegisterPage, RisksPage. |
| 1.6 | 2024-12-20 | Development Team | Added "Searchable Select/Combobox Inside Dialog Pattern" to Module Interaction Patterns section. Documents critical issue where portaled components (Popover, Select) inside Dialog modals cause aria-hidden conflicts that block all interactions. Provides solution using ModalCombobox component with absolute positioning (no portals) for guaranteed interactivity inside Dialogs. Includes failed solution attempts, root cause analysis, implementation principles, and usage patterns. Updated Form Components section with warning about using ModalCombobox inside dialogs. |
| 1.5 | 2024-12-XX | Development Team | Merged form layout principles from `frontend-form-general-layout.md`, including page structure patterns (PageHeader → max-w-4xl wrapper → Form Component), component hierarchy guidelines, layout patterns (two-column grid, spacing standards), state patterns (loading/error states), and action button patterns. Enhanced "Form Page Specific Guidelines" and "Form Component Patterns" sections with complete implementation examples and quick reference checklist. |
| 1.4 | 2024-12-XX | Development Team | Added Dropdown + Dialog pattern to Table Display Patterns section. Includes critical pattern for preventing focus trap issues when dropdown menus interact with dialogs, with state management, event handling, and cleanup best practices. |
| 1.3 | 2024-12-XX | Development Team | Added comprehensive UI/UX principles section for back-office systems, including user-centered design principles, layout patterns (Master-Detail, Data Density), component patterns (Data Tables, Search & Filters, Modal vs Page), advanced features (Bulk Actions, Undo/Redo, Audit Trails, Export), form-specific guidelines, and enhanced design system details (typography scale, spacing system, button hierarchy, icon usage, semantic status colors). Merged UI/UX principles from `ui-ux-principle.md`. |
| 1.2 | 2024-12-XX | Development Team | Added comprehensive design system documentation including color system, typography, spacing, component patterns, theme system, animations, and design system best practices |
| 1.1 | 2024-12-XX | Development Team | Added comprehensive module interaction patterns, API conventions, CRUD patterns, form handling, error handling, implementation checklists, code examples library, and development workflow guidelines |
| 1.0 | 2024-01-XX | Development Team | Initial version with modular architecture principles |
