> [← Design System Index](./index.md)
>
> *Back-office UI/UX principles and layout & structure patterns. See the [design system index](./index.md) for all sub-files (component patterns, PDF export, workflow status, form layout, tokens, etc.).*

## 🎨 UI/UX Principles

### Overview

When designing UI/UX for **back-office systems** (ERP, Internal Dashboards), the focus is on **efficiency, clarity, and accuracy** rather than aesthetics. Users are professionals who perform repetitive tasks, so the design should minimize friction and errors. These principles guide all design decisions and implementation patterns.

### Core Principles

#### 1. User-Centered Design
- **Understand your users**: Identify roles, responsibilities, and workflow patterns
- **Design for efficiency**: Minimize clicks, typing, and unnecessary data exposure
- **Role-based access**: Different users may need different views or permissions
- **Smart defaults**: Default frequently used values to reduce user effort

*Example:* Default frequently used products or warehouses in inventory forms.

#### 2. Task-Oriented Layout
- Prioritize **frequent tasks** prominently
- Group related fields logically following natural data entry flow
- Highlight **primary actions** (Save, Submit, Approve) consistently
- Arrange form fields to follow the natural **flow of data entry**

#### 3. Clarity and Simplicity
- Use **clear labels and hints**; avoid unnecessary jargon
- **Avoid clutter**: Show only fields needed for the task
- Ensure consistent alignment, spacing, and typography
- Left-aligned labels, right-aligned inputs, consistent font sizes

#### 4. Feedback and Error Prevention
- Provide **real-time validation** with immediate, contextual feedback
- Confirm destructive actions (delete, approve) before execution
- Use **progress indicators** for multi-step forms
- **Principle**: "Prevent mistakes and help users recover quickly"

#### 5. Efficiency & Keyboard Navigation
- Support **keyboard shortcuts** and full tab navigation
- Minimize modal popups; prefer inline editing when possible
- Enable **bulk actions** for repetitive operations
- Logical tab order, skip disabled/readonly fields

#### 6. Consistency & Predictability
- Maintain consistent layout, colors, icons, and terminology across all modules
- Users should **predict outcomes** of actions
- Follow platform conventions for web apps and ERP dashboards
- Use design system components consistently

#### 7. Hierarchy and Visual Prioritization
- Highlight important fields and actions prominently
- Secondary info can be muted or collapsible
- Use spacing and grouping to **guide attention efficiently**
- Visual weight should match importance

#### 8. Accessibility
- Ensure **readable font sizes** and high color contrast (WCAG AA minimum)
- Support screen readers with proper ARIA labels
- Enable **keyboard-only navigation** for power users
- Semantic HTML structure

#### 9. Performance Awareness
- Optimize for **fast load times** and responsive interactions
- Minimize server calls and unnecessary page refreshes
- Provide smart defaults to reduce user effort
- Use loading states and skeleton screens appropriately

#### 10. Mobile / Responsive Design
- Desktop-first approach is standard for back-office systems
- Minimum viewport width: 1280px for comfortable ERP work
- Responsive design may be needed for tablet/portable devices
- Prioritize simplified forms for smaller screens

### Layout & Structure Patterns

> Layout *patterns* (Master-Detail, Data Density, Fixed Navigation) — for the form-page structure spec (PageHeader → `max-w-4xl` → Card, spacing standards, grid rules), see [form-layout.md](./form-layout.md).

#### Master-Detail Pattern
- **Left/Top**: List view with selectable items
- **Right/Bottom**: Detail panel showing selected item
- Common in order management, customer records, product catalogs
- Enables quick scanning and detailed editing

#### Data Density
- ERP users often prefer **dense information** (more rows visible)
- Provide density toggle options: Comfortable → Compact → Dense
- Balance: Too sparse wastes space, too cramped causes errors
- Default to comfortable, allow user preference

#### Fixed Navigation
- **Fixed header**: Keep primary navigation and search always visible
- **Fixed sidebar**: Pin menu for quick access across pages
- **Sticky table headers**: Column headers remain visible during scroll
- Maintains context during long data entry sessions

#### Layout Options
- **Card View**: Better for visual content, fewer items
- **List/Table View**: Optimal for scanning many items with details (primary for ERP)
- **Grid View**: Product catalogs, image galleries

#### Whitespace Strategy
- Use **consistent spacing units** (8px grid: 4px, 8px, 16px, 24px, 32px)
- Group related content with tighter spacing
- Separate sections with wider spacing or dividers
- Follow Tailwind spacing scale consistently

### Summary Principle

> For back-office systems, **efficiency, clarity, and error prevention** are more important than visual flourish. Design with **consistent spacing, semantic colors, clear typography, and dense data displays**. Use **data tables as primary interface**, support **keyboard navigation and bulk actions**, and provide **immediate feedback** with proper status indicators. Layout should be **task-oriented, logically grouped**, and guide users with minimal cognitive load while maximizing information density.
