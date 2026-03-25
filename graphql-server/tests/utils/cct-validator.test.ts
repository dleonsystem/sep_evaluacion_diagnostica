import { validateCCT, calculateCCTVerifier } from '../../src/utils/cct-validator';

describe('CCT Validator', () => {
    it('should correctly calculate the verifier for 01DPR0001', () => {
        expect(calculateCCTVerifier('01DPR0001')).toBe('V');
    });

    it('should validate a correct CCT (01DPR0001V)', () => {
        const result = validateCCT('01DPR0001V');
        expect(result.isValid).toBe(true);
    });

    it('should reject a CCT with an incorrect verifier', () => {
        const result = validateCCT('01DPR0001A');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('El dígito verificador no coincide');
    });

    it('should reject a CCT with an invalid format', () => {
        const result = validateCCT('01DP0001D'); // 9 chars
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Formato de CCT inválido');
    });

    it('should validate 24PPR0356K (from requirement example)', () => {
        expect(validateCCT('24PPR0356K').isValid).toBe(true);
    });

    it('should validate 11KJN1605S (Preescolar user case)', () => {
        expect(validateCCT('11KJN1605S').isValid).toBe(true);
    });
});
