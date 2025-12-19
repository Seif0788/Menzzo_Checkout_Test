import fs from 'fs';
import path from 'path';

export function loadCategoriesFromCSV(csvPath: string): string[] {
    const absolutePath = path.resolve(csvPath);
    const content = fs.readFileSync(absolutePath, 'utf-8');

    return content
        .split('\n')
        .slice(1) // remove header
        .map(line => line.split(',')[1])
        .filter(Boolean)
        .map(name => name.trim());
}
