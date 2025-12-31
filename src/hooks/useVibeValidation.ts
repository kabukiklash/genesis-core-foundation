import { useMemo } from 'react';
import { ValidationResult, ValidationStatus } from '@/types/vibecode';
import { parseVibeCode } from '@/lib/vibecode/parser';
import { validateParsedCode } from '@/lib/vibecode/validator';
import { simulateCell, generateSimulatedLog } from '@/lib/vibecode/simulator';

export function useVibeValidation(code: string): ValidationResult {
  return useMemo(() => {
    if (!code.trim()) {
      return {
        status: 'VALID' as ValidationStatus,
        issues: [],
        simulatedCell: null,
        simulatedLog: [],
      };
    }

    // Parse the code
    const parsed = parseVibeCode(code);

    // Validate against PER rules
    const issues = validateParsedCode(parsed, code);

    // Determine status
    const hasErrors = issues.some(i => i.level === 'error');
    const hasWarnings = issues.some(i => i.level === 'warning');
    const status: ValidationStatus = hasErrors ? 'ERROR' : hasWarnings ? 'WARNING' : 'VALID';

    // Simulate cell only if no errors
    const simulatedCell = hasErrors ? null : simulateCell(parsed);
    const simulatedLog = generateSimulatedLog(parsed);

    return {
      status,
      issues,
      simulatedCell,
      simulatedLog,
    };
  }, [code]);
}
