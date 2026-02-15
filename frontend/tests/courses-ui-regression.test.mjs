import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const readSource = (relativePath) =>
    fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

test('TC-028: CourseDetailPage header supports long title with proportional layout classes', () => {
    const source = readSource('frontend/src/modules/courses/pages/CourseDetailPage.tsx');

    assert.match(
        source,
        /<div className="flex items-start gap-2 mb-2">[\s\S]*?<h1 className="text-2xl font-bold break-words min-w-0 flex-1" title=\{course\.title\}>[\s\S]*?<Badge[^>]*className=\{`\$\{getStatusColor\(course\.status\)\} border-0 capitalize shrink-0 mt-1`\}/,
        'Header should use items-start, flexible title width, and non-shrinking badge for long title robustness',
    );

    assert.doesNotMatch(
        source,
        /line-clamp-2/,
        'Header title should not clamp to 2 lines to avoid non-proportional rendering',
    );
});

test('TC-030a: CoursesPage always renders categories area with fallback text', () => {
    const source = readSource('frontend/src/modules/courses/pages/CoursesPage.tsx');

    assert.match(
        source,
        /<div className="flex gap-1 mt-1 min-h-\[22px\]">[\s\S]*?course\.categories && course\.categories\.length > 0 \?[\s\S]*?: \([\s\S]*?<span className="text-xs text-muted-foreground italic">No categories<\/span>/,
        'List rows should always reserve categories area and render fallback when empty',
    );

    assert.doesNotMatch(
        source,
        /course\.categories && course\.categories\.length > 0 && \(/,
        'Conditional block should not hide categories area when categories are empty',
    );
});
