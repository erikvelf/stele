import { it } from 'date-fns/locale';

// The Italian week starts on Monday; taking it from the locale keeps that
// decision in one place rather than as a weekStartsOn literal per call.
export const WEEK_OPTIONS = { locale: it } as const;
