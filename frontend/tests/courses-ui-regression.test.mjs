import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const readSource = (relativePath) => {
    const candidates = [
        path.resolve(process.cwd(), relativePath),
        path.resolve(process.cwd(), '..', relativePath),
    ];

    const matchedPath = candidates.find((candidate) => fs.existsSync(candidate));

    if (!matchedPath) {
        throw new Error(`Source file not found for ${relativePath}`);
    }

    return fs.readFileSync(matchedPath, 'utf8');
};

test('TC-028: CourseDetailPage header supports long title with proportional layout classes', () => {
    const source = readSource('frontend/src/modules/courses/pages/CourseDetailPage.tsx');

    assert.match(
        source,
        /<div className="flex items-start gap-2 mb-2">[\s\S]*?<h1 className="text-2xl font-bold break-words min-w-0 flex-1" title=\{course\.title\}>/,
        'Header should keep flexible title width after course metadata removal',
    );

    assert.doesNotMatch(
        source,
        /course\.status|getStatusColor\(/,
        'Course detail page should no longer render course status metadata',
    );
});

test('TC-030a: CoursesPage removes unused course metadata controls', () => {
    const source = readSource('frontend/src/modules/courses/pages/CoursesPage.tsx');

    assert.doesNotMatch(
        source,
        /id: 'status'|id: 'difficulty'|id: 'language'|course\.status|getStatusColor\(|getDifficultyColor\(|params\.status =|TabsTrigger value="published"|TabsTrigger value="draft"/,
        'CoursesPage should no longer expose removed course metadata in filters, tabs, or table badges',
    );
});

test('TC-031: CourseForm omits removed metadata fields from schema and payload', () => {
    const source = readSource('frontend/src/modules/courses/pages/CourseForm.tsx');

    assert.doesNotMatch(
        source,
        /difficulty|language|name="status"|id: 'status'|data\.status|course\.status/,
        'CourseForm should remove the deleted course metadata fields from the course form implementation',
    );
});

test('TC-032: CoursePlayerPage keeps sidebar accessible on compact screens', () => {
    const source = readSource('frontend/src/modules/courses/pages/CoursePlayerPage.tsx');

    assert.match(
        source,
        /<Button\s+variant="outline"\s+size="sm"\s+className="lg:hidden"\s+onClick=\{\(\) => setSidebarOpen\(true\)\}/,
        'CoursePlayerPage should render a compact-screen sidebar toggle button',
    );

    assert.match(
        source,
        /<Sheet open=\{sidebarOpen\} onOpenChange=\{setSidebarOpen\}>[\s\S]*?<aside className="hidden w-80 flex-col border-r lg:flex">/,
        'CoursePlayerPage should support both mobile sheet navigation and always-visible desktop sidebar',
    );
});
