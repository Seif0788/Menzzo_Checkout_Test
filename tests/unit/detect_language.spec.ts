import { test, expect } from '@playwright/test';
import { detectLanguage } from '../../helpers/detect_language';

test.describe('detectLanguage Helper Tests', () => {

    test.describe('German Detection', () => {
        test('should detect German from product names with keywords', () => {
            expect(detectLanguage('Bett mit verstellbarem Lattenrost')).toBe('de');
            expect(detectLanguage('Dunkles Holz Sessel')).toBe('de');
            expect(detectLanguage('Modernes Ecksofa in grauer Farbe')).toBe('de');
            expect(detectLanguage('KOMMODE MIT SCHRANK')).toBe('de'); // uppercase
        });

        test('should detect German from furniture terms', () => {
            expect(detectLanguage('Stuhl aus Holz')).toBe('de');
            expect(detectLanguage('Couchtisch modern')).toBe('de');
        });
    });

    test.describe('French Detection', () => {
        test('should detect French from accented characters', () => {
            expect(detectLanguage('Canapé d\'angle convertible')).toBe('fr');
            expect(detectLanguage('Chaise en bois foncé')).toBe('fr');
            expect(detectLanguage('Table basse créée en chêne')).toBe('fr');
            expect(detectLanguage('Fauteuil élégant')).toBe('fr');
        });

        test('should detect French from common words', () => {
            expect(detectLanguage('Lit avec matelas intégré')).toBe('fr');
            expect(detectLanguage('Bibliothèque murale')).toBe('fr');
        });
    });

    test.describe('Italian Detection', () => {
        test('should detect Italian from accented characters', () => {
            expect(detectLanguage('Tavolino moderno in legno')).toBe('it');
            expect(detectLanguage('Poltrona elegante è comoda')).toBe('it');
            expect(detectLanguage('Divano con poggiapiedi')).toBe('it');
        });

        test('should detect Italian from unique accents', () => {
            expect(detectLanguage('Sedia più comoda')).toBe('it');
            expect(detectLanguage('Libreria può essere')).toBe('it');
        });
    });

    test.describe('Spanish Detection', () => {
        test('should detect Spanish from accented characters', () => {
            expect(detectLanguage('Sofá cómodo y elegante')).toBe('es');
            expect(detectLanguage('Silla de madera ñoño')).toBe('es');
            expect(detectLanguage('Mesa rústica')).toBe('es');
        });

        test('should detect Spanish from ñ character', () => {
            expect(detectLanguage('Diseño español')).toBe('es');
            expect(detectLanguage('Pequeño armario')).toBe('es');
        });
    });

    test.describe('Portuguese Detection', () => {
        test('should detect Portuguese from accented characters', () => {
            expect(detectLanguage('Sofá confortável e moderno')).toBe('pt');
            expect(detectLanguage('Cadeira de madeira maciça')).toBe('pt');
            expect(detectLanguage('Mesa rústica com gavetas')).toBe('pt');
        });

        test('should detect Portuguese from unique accents', () => {
            expect(detectLanguage('Estante com prateleiras')).toBe('pt');
            expect(detectLanguage('Poltrona reclinável')).toBe('pt');
        });
    });

    test.describe('Dutch Detection', () => {
        test('should detect Dutch from letter combinations', () => {
            expect(detectLanguage('Stoel van hout')).toBe('nl');
            expect(detectLanguage('Tafel met lades')).toBe('nl');
            expect(detectLanguage('Bed met opbergruimte')).toBe('nl');
        });

        test('should detect Dutch from common patterns', () => {
            expect(detectLanguage('Kast voor boeken')).toBe('nl');
            expect(detectLanguage('Fauteuil met voetenbank')).toBe('nl');
        });

        test('should detect Dutch from ij pattern', () => {
            expect(detectLanguage('Vrijstaande kast')).toBe('nl');
            expect(detectLanguage('Blijvend mooi')).toBe('nl');
        });
    });

    test.describe('Unknown / Edge Cases', () => {
        test('should return unknown for English text', () => {
            expect(detectLanguage('Modern wooden chair')).toBe('unknown');
            expect(detectLanguage('Coffee table with storage')).toBe('unknown');
        });

        test('should return unknown for empty or short text', () => {
            expect(detectLanguage('')).toBe('unknown');
            expect(detectLanguage('123')).toBe('unknown');
            expect(detectLanguage('ABC')).toBe('unknown');
        });

        test('should return unknown for mixed numbers and symbols', () => {
            expect(detectLanguage('12345')).toBe('unknown');
            expect(detectLanguage('!@#$%')).toBe('unknown');
        });

        test('should handle text with numbers', () => {
            expect(detectLanguage('Bett 180x200 cm')).toBe('de');
            expect(detectLanguage('Canapé 3 places')).toBe('fr');
        });
    });

    test.describe('Priority Tests', () => {
        test('German keywords should take priority over accents', () => {
            // If text has both German keywords and French accents, German should win
            expect(detectLanguage('Bett élégant')).toBe('de');
            expect(detectLanguage('Sofa très confortable')).toBe('de');
        });

        test('should handle case insensitivity', () => {
            expect(detectLanguage('BETT MIT LATTENROST')).toBe('de');
            expect(detectLanguage('canapé d\'angle')).toBe('fr');
            expect(detectLanguage('TAVOLINO MODERNO')).toBe('it');
        });
    });

    test.describe('Real World Product Names', () => {
        test('should detect language from actual product names', () => {
            // German
            expect(detectLanguage('Boxspringbett mit Bettkasten 160x200')).toBe('de');

            // French
            expect(detectLanguage('Canapé d\'angle réversible en tissu gris')).toBe('fr');

            // Italian
            expect(detectLanguage('Divano angolare con penisola a destra')).toBe('it');

            // Spanish
            expect(detectLanguage('Sofá rinconera con chaise longue')).toBe('es');

            // Dutch
            expect(detectLanguage('Hoekbank met chaise longue links')).toBe('nl');
        });
    });
});
