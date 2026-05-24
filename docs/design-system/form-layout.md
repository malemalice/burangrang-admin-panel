> [← Design System Index](./index.md)
>
> *Form page visual standards: field organisation, column layout, page structure (PageHeader → max-w-4xl → Card form), spacing standards, loading/error state patterns, optimal viewport. Source: split from principles.md L545–677 on 2026-05-24.*

## Form Page Specific Guidelines

### Field Organization
1. **Field grouping & sequence**: Match the workflow of users
2. **Default values & smart suggestions**: Reduce typing effort
3. **Inline help / tooltips**: Only show on focus or hover
4. **Mandatory vs optional fields**: Clearly mark required fields with asterisk
5. **Save progress / draft**: For long forms, allow partial saves
6. **Validation & error messages**: Immediate, contextual, non-intrusive
7. **Field width**: Match expected input length (zip code narrower than address)
8. **Related fields grouping**: Address fields together, contact fields together
9. **Tab stops**: Logical order, skip disabled/readonly fields

### Form Column Layout
- **Single column** (mobile, narrow screens):
  - Stack all fields vertically
  - Full-width inputs
- **Two column** (desktop, standard):
  - Related fields side-by-side
  - Reduce vertical scrolling
  - Each column: 300-400px
- **Three column** (wide screens, dense forms):
  - Maximum density
  - Only for simple, short fields
  - Not recommended for complex inputs

### Page Structure & Component Hierarchy

**Standard Form Page Structure:**
```
PageHeader → max-w-4xl wrapper → Form Component (Card)
```

**Create/Edit Pages Pattern:**
- **PageHeader** with title, subtitle, and optional back button
- **max-w-4xl mx-auto** wrapper to constrain form width
- Form component (Card inside wrapper)

**Form Component Structure:**
- ❌ **NO PageHeader inside form component** - PageHeader belongs at page level
- Returns **Card** directly with CardHeader and CardContent
- Uses `space-y-6` for consistent form field spacing

**Example Structure:**
```tsx
// Page level (Create/Edit Page)
<PageHeader
  title="Create/Edit [Entity]"
  subtitle="Description or context"
  actions={
    <Button variant="outline" onClick={() => navigate('/path')}>
      <ArrowLeft className="mr-2 h-4 w-4" /> Back to [Entities]
    </Button>
  }
/>
<div className="max-w-4xl mx-auto">
  <[Entity]Form entity={entity} mode={mode} />
</div>

// Form Component
<Card>
  <CardHeader>
    <CardTitle>{mode === 'create' ? 'Create' : 'Edit'} [Entity]</CardTitle>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields */}
      </form>
    </Form>
  </CardContent>
</Card>
```

### Layout Patterns & Spacing Standards

**Field Organization:**
- **Two-column grid**: Related fields (name/code, first/last name)
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormField name="firstName" />
    <FormField name="lastName" />
  </div>
  ```
- **Single column**: Full-width fields (email, description, textareas)

**Spacing Standards:**
- Form container: `space-y-6` (between form sections)
- Grid gaps: `gap-6` (between grid columns/rows)
- Button group: `gap-4` (between action buttons)
- CardContent: `space-y-6` (internal form spacing)

**Action Buttons:**
- **Position**: `flex justify-end gap-4` at form bottom
- **Cancel**: `variant="outline"`
- **Submit**: Primary button (default variant)
- **Text**: Context-specific ("Create", "Save Changes", "Update")

### State Patterns

**Loading State:**
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <div className="flex items-center gap-2">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span>Loading [entity] details...</span>
  </div>
</div>
```

**Error State (Not Found):**
```tsx
<div className="text-center py-12">
  <h2 className="text-xl font-semibold text-gray-900 mb-2">[Entity] not found</h2>
  <p className="text-gray-600 mb-4">The [entity] you're looking for doesn't exist or has been deleted.</p>
  <Button onClick={() => navigate('/path')}>
    <ArrowLeft className="mr-2 h-4 w-4" /> Back to [Entities]
  </Button>
</div>
```

### Optimal Viewport & Layout
- **Minimum width**: 1280px (comfortable ERP work)
- **Ideal width**: 1366px - 1920px (most common desktop)
- **Maximum content width**: 1600px (prevents excessive line length)
- **Below 1280px**: Show simplified view or horizontal scroll warning
- **Sidebar Navigation**: 240-280px (expanded), 64-72px (collapsed)
- **Content Layout**:
  - Full-width: Data tables, dashboards, reports
  - Constrained width: Forms (max 800-1000px for readability)
  - Two-column: Long forms with left-right split
  - Three-column: Master-detail with additional panel
