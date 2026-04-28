import { Plus, X } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { Switch } from '@/core/components/ui/switch';
import { SearchableSelect } from '@/core/components/ui/searchable-select';
import { WorkPermitSubsectionTitle } from './WorkPermitSection';
import { WORK_PERMIT_SECTIONS, WORK_PERMIT_SECTION_F_SUB } from '../constants/workPermitSections';

/** Course rows while editing; requirement is controlled by the section switch above. */
export type HseRequiredCourseDraft = { courseId: string; order: number };

type WorkPermitHseSectionFReviewProps = {
  requireCourseVerification: boolean;
  onRequireCourseVerificationChange: (value: boolean) => void;
  requiredCourses: HseRequiredCourseDraft[];
  onRequiredCoursesChange: (rows: HseRequiredCourseDraft[]) => void;
  courseOptions: Array<{ value: string; label: string }>;
};

/**
 * Section F — course verification & required courses for HSE approval (reviewer-only).
 */
export function WorkPermitHseSectionFReview({
  requireCourseVerification,
  onRequireCourseVerificationChange,
  requiredCourses,
  onRequiredCoursesChange,
  courseOptions,
}: WorkPermitHseSectionFReviewProps) {
  const updateRow = (index: number, patch: Partial<HseRequiredCourseDraft>) => {
    const next = [...requiredCourses];
    next[index] = { ...next[index], ...patch };
    onRequiredCoursesChange(next);
  };

  const addRow = () => {
    onRequiredCoursesChange([
      ...requiredCourses,
      {
        courseId: '',
        order: requiredCourses.length,
      },
    ]);
  };

  const removeRow = (index: number) => {
    onRequiredCoursesChange(
      requiredCourses
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, order: i })),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">{WORK_PERMIT_SECTIONS.F}</p>

      <Card>
        <CardHeader>
          <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.courseVerification}</WorkPermitSubsectionTitle>
          <CardDescription>Require course verification for workers on this permit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="hse-require-course-verification">Require course verification</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, applicants must complete the listed courses before work proceeds as defined by your
                process.
              </p>
            </div>
            <Switch
              id="hse-require-course-verification"
              checked={requireCourseVerification}
              onCheckedChange={onRequireCourseVerificationChange}
            />
          </div>
        </CardContent>
      </Card>

      {requireCourseVerification && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.requiredCourses}</WorkPermitSubsectionTitle>
              <CardDescription>Courses required for workers on this project.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" /> Add course
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses added yet. Add at least one course or turn off verification.</p>
            ) : (
              requiredCourses.map((row, index) => (
                <div key={index} className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <SearchableSelect
                      options={courseOptions}
                      value={row.courseId}
                      onValueChange={(v) => updateRow(index, { courseId: v ?? '' })}
                      placeholder="Select course"
                      searchPlaceholder="Search courses..."
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} aria-label="Remove row">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
