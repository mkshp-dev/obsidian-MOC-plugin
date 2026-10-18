import { moment } from 'obsidian';

/**
 * Date parameters such as `{{now-2h}}`, `{{startOfDay}}` or `{{startOfMonth-1m:YYYY-MM}}`.
 *
 * Every parameter names a single point in time and is replaced with text
 * before the block runs, exactly like `{{this.filename}}`. Ranges are written
 * out with two points. Times come from Obsidian's own `moment`, so week
 * boundaries follow the locale Obsidian sets from the app language.
 */

export type Moment = ReturnType<typeof moment>;

export type DateAnchor =
    | 'now'
    | 'startofday'
    | 'endofday'
    | 'startofweek'
    | 'endofweek'
    | 'startofmonth'
    | 'endofmonth'
    | 'startofyear'
    | 'endofyear';

export type DateUnit = 'h' | 'd' | 'w' | 'm' | 'y';

export interface DateOffset {
    amount: number;
    unit: DateUnit;
}

export interface DateExpression {
    anchor: DateAnchor;
    offsets: DateOffset[];
}

/** Anchors as they are written in blocks. */
export const DATE_ANCHORS = [
    'now',
    'startOfDay',
    'endOfDay',
    'startOfWeek',
    'endOfWeek',
    'startOfMonth',
    'endOfMonth',
    'startOfYear',
    'endOfYear',
];

/** Read-only keys `properties()` resolves from the note itself rather than its frontmatter. */
export const FILE_DATE_KEYS = ['file.day', 'file.ctime', 'file.mtime'];

/** A point in time needs its time of day, so that is the default. */
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const ANCHORS = new Map<string, DateAnchor>(DATE_ANCHORS.map(anchor => [anchor.toLowerCase(), anchor.toLowerCase() as DateAnchor]));

const UNIT_NAMES: Record<DateUnit, 'hours' | 'days' | 'weeks' | 'months' | 'years'> = {
    h: 'hours',
    d: 'days',
    w: 'weeks',
    m: 'months',
    y: 'years'
};

/**
 * Words that show a `{{…}}` was meant as a date. Anything else, such as
 * `{{this.filename}}` or literal braces being searched for, is left alone.
 * `today`, `yesterday` and `tomorrow` are included so they get a helpful
 * error rather than silently staying as text.
 */
const DATE_WORD_PATTERN = /^(?:now|start|end|today|yesterday|tomorrow)/i;

const PARAM_PATTERN = /\{\{([^{}]*)\}\}/g;

/** What the inside of a `{{…}}` is, as far as date parameters are concerned. */
export type DateParam =
    | { kind: 'date'; date: DateExpression; format: string }
    | { kind: 'invalid'; reason: string }
    | { kind: 'other' };

/** Classifies the inside of a `{{…}}`: a valid date, a date that does not parse, or something else. */
export function parseDateParam(body: string): DateParam {
    const colon = body.indexOf(':');
    const expression = (colon === -1 ? body : body.slice(0, colon)).trim();
    const format = colon === -1 ? '' : body.slice(colon + 1).trim();

    const match = expression.match(/^([a-zA-Z]+)(.*)$/);
    if (!match || !DATE_WORD_PATTERN.test(match[1]!)) return { kind: 'other' };

    const word = match[1]!;
    const anchor = ANCHORS.get(word.toLowerCase());
    if (!anchor) {
        if (/^(?:today|yesterday|tomorrow)$/i.test(word)) {
            return { kind: 'invalid', reason: `'${word}' is a whole day, not a point in time. Use {{startOfDay}} and {{endOfDay}}, with an offset such as -1d.` };
        }
        return { kind: 'invalid', reason: `unknown date '${word}'. Use one of: ${DATE_ANCHORS.join(', ')}.` };
    }

    const offsets: DateOffset[] = [];
    const rest = match[2]!;
    const offsetPattern = /([+-])(\d+(?:\.\d+)?)([a-zA-Z]*)/y;
    let position = 0;

    while (position < rest.length) {
        offsetPattern.lastIndex = position;
        const offset = offsetPattern.exec(rest);
        if (!offset) {
            return { kind: 'invalid', reason: `could not read '${rest.slice(position)}'. Offsets look like +7d or -2h.` };
        }
        const [, sign, digits, unit] = offset;
        if (digits!.includes('.')) {
            return { kind: 'invalid', reason: 'offsets must be whole numbers, such as -2h or +7d.' };
        }
        if (!(unit! in UNIT_NAMES)) {
            return { kind: 'invalid', reason: `unknown unit '${unit}'. Use h (hours), d (days), w (weeks), m (months) or y (years).` };
        }
        offsets.push({ amount: Number(sign! + digits!), unit: unit as DateUnit });
        position = offsetPattern.lastIndex;
    }

    return { kind: 'date', date: { anchor, offsets }, format: format || DEFAULT_DATE_FORMAT };
}

/** Parses the inside of a date parameter, such as `startOfMonth-1m`. Null if it is not one. */
export function parseDateExpression(expression: string): DateExpression | null {
    const parsed = parseDateParam(expression);
    return parsed.kind === 'date' ? parsed.date : null;
}

/**
 * Resolves a date expression to a point in time.
 *
 * Offsets move the point first, then the anchor snaps it to the edge of the
 * day, week, month or year it lands in. So `startOfMonth-1m` is the first
 * moment of last month, and `endOfMonth+1m` always the last moment of next
 * month: snapping first would let month clamping turn 30 September's
 * `endOfMonth+1m` into 30 October.
 */
export function resolveDate(date: DateExpression, now: Moment): Moment {
    const point = now.clone();

    for (const offset of date.offsets) {
        point.add(offset.amount, UNIT_NAMES[offset.unit]);
    }

    switch (date.anchor) {
        case 'startofday': return point.startOf('day');
        case 'endofday': return point.endOf('day');
        case 'startofweek': return point.startOf('week');
        case 'endofweek': return point.endOf('week');
        case 'startofmonth': return point.startOf('month');
        case 'endofmonth': return point.endOf('month');
        case 'startofyear': return point.startOf('year');
        case 'endofyear': return point.endOf('year');
        default: return point;
    }
}

/**
 * Replaces date parameters with formatted points in time. The format after
 * the colon is a moment format string and defaults to `YYYY-MM-DDTHH:mm:ss`.
 * Invalid parameters are left as they are; `findParameterError` reports them.
 */
export function expandDateParams(text: string, now: Moment = moment()): string {
    return text.replace(PARAM_PATTERN, (match, body: string) => {
        const parsed = parseDateParam(body);
        return parsed.kind === 'date' ? resolveDate(parsed.date, now).format(parsed.format) : match;
    });
}

/** True when `text` contains a valid date parameter. */
export function hasDateParams(text: string): boolean {
    for (const match of text.match(PARAM_PATTERN) ?? []) {
        if (parseDateParam(match.slice(2, -2)).kind === 'date') return true;
    }
    return false;
}

/**
 * Reads a value as a point in time, in milliseconds, or returns null if it is
 * not a date. Only ISO values starting with `YYYY-MM` count, so a number such
 * as `2` or `2026` is never mistaken for a date. A value without a time means
 * the first moment of that day (or month) in local time, so `2026-10-21` is
 * local midnight rather than the UTC midnight `Date.parse` would give.
 */
export function parseDateValue(value: unknown): number | null {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value.getTime();
    }
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}/.test(trimmed)) return null;

    const parsed = moment(trimmed, moment.ISO_8601, true);
    return parsed.isValid() ? parsed.valueOf() : null;
}

/** Local midnight of the first `YYYY-MM-DD` in a filename, as used by daily notes. */
export function filenameToTime(basename: string): number | null {
    const match = basename.match(/(\d{4}-\d{2}-\d{2})/);
    if (!match) return null;
    const parsed = moment(match[1], 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed.valueOf() : null;
}

export function compareTimes(left: number, operator: string, right: number): boolean {
    switch (operator) {
        case '==': return left === right;
        case '!=': return left !== right;
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        default: return false;
    }
}

/** The local calendar day, used to notice when the date has changed. */
export function currentDay(now: Moment = moment()): string {
    return now.format('YYYY-MM-DD');
}

/** Milliseconds from `now` until the next local midnight. */
export function msUntilNextDay(now: Moment = moment()): number {
    return now.clone().add(1, 'days').startOf('day').diff(now);
}
