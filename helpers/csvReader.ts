import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { ProductRow } from './utils';

export function loadCategoriesFromCSV(csvPath: string): string[] {
    const absolutePath = path.resolve(csvPath);
    const content = fs.readFileSync(absolutePath, 'utf-8');

    const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';' // <-- IMPORTANT, tells it to split by semicolon
    });

    const names: string[] = parsed.data
        .map((row: any) => row.Name)
        .filter(Boolean)
        .map((name: string) => name.trim());

    return names;
}

export function getRandomProduct(products: ProductRow[]): ProductRow {
    const randomIndex = Math.floor(Math.random() * products.length);
    return products[randomIndex];
}
