import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/core': path.resolve(__dirname, './src/core'),
            '@/modules': path.resolve(__dirname, './src/modules'),
            '@/shared': path.resolve(__dirname, './src/shared'),
        },
    },
});
