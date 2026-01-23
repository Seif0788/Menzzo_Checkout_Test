declare module 'langdetect' {
    export interface LanguageDetectionResult {
        lang: string;
        prob: number;
    }
    export function detect(text: string): LanguageDetectionResult[];
    export function detectOne(text: string): string | null;
}
