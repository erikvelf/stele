// A span of whole calendar days, labelled by what kind of period it is. The
// kind is what decides the phrasing: the same two dates read as a plain run
// of days for 'range' and as a named week for 'week'.
export type PeriodKind = 'range' | 'week' | 'month';

export interface Period {
  kind: PeriodKind;
  start: Date;
  end: Date;
}
