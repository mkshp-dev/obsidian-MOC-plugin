import assert from 'node:assert';
import { test, describe } from 'node:test';
import { moment } from 'obsidian';
import { compareTimes, expandDateParams, filenameToTime, findDateParamError, hasDateParams, msUntilNextDay, parseDateExpression, parseDateValue, resolveDate } from '../relative-dates';
import { configUsesDateParams, evaluateFrontmatter, expandDynamicParams, MocConfig, parseFilter, resolveScope } from '../moc';

// A zone west of UTC exposes the trap where a date-only string parsed as UTC
// midnight lands on the previous local day. Node applies TZ changes at runtime.
process.env.TZ = 'America/Los_Angeles';

/** Wednesday 21 October 2026, 15:30 local time. The default `en` locale starts weeks on Sunday. */
const now = () => moment('2026-10-21 15:30', 'YYYY-MM-DD HH:mm');
const at = (value: string) => moment(value, 'YYYY-MM-DD HH:mm');
const FORMAT = 'YYYY-MM-DD HH:mm';

function resolve(expression: string, base = now()): string {
    const parsed = parseDateExpression(expression);
    assert.ok(parsed, `'${expression}' should parse`);
    return resolveDate(parsed, base).format(FORMAT);
}

/** Expands date parameters the way a render does, then evaluates at file level. */
function frontmatterMatches(filter: string, frontmatter: Record<string, unknown>, base = now()): boolean | null {
    const parsed = parseFilter(expandDateParams(filter, base));
    assert.ok(parsed, `'${filter}' should parse`);
    return evaluateFrontmatter(frontmatter, parsed);
}

function fileMatches(filter: string, file: { ctime?: number; mtime?: number; basename?: string }, base = now()): boolean | null {
    const parsed = parseFilter(expandDateParams(filter, base));
    assert.ok(parsed, `'${filter}' should parse`);
    return evaluateFrontmatter({}, parsed, {
        file: { ctime: file.ctime ?? 0, mtime: file.mtime ?? 0, basename: file.basename ?? 'note' }
    });
}

void describe('Date parameters - Grammar', () => {
    void test('accepts every anchor, case-insensitively', () => {
        for (const anchor of ['now', 'startOfDay', 'endOfDay', 'startOfWeek', 'endOfWeek', 'startOfMonth', 'endOfMonth', 'startOfYear', 'endOfYear', 'STARTOFDAY', 'Now']) {
            assert.ok(parseDateExpression(anchor), anchor);
        }
    });

    void test('parses chained offsets in order', () => {
        assert.deepStrictEqual(parseDateExpression('now+1w-2h'), {
            anchor: 'now',
            offsets: [{ amount: 1, unit: 'w' }, { amount: -2, unit: 'h' }]
        });
    });

    void test('rejects what is not a date expression', () => {
        for (const value of ['today', 'now-7', 'now-7x', 'now-0.5h', 'now 7d', '7d', '', 'this.filename']) {
            assert.strictEqual(parseDateExpression(value), null, `'${value}' should not parse`);
        }
    });
});

void describe('Date parameters - Resolution', () => {
    void test('now and its offsets keep the time of day', () => {
        assert.strictEqual(resolve('now'), '2026-10-21 15:30');
        assert.strictEqual(resolve('now-2h'), '2026-10-21 13:30');
        assert.strictEqual(resolve('now-7d'), '2026-10-14 15:30');
        assert.strictEqual(resolve('now+1w-2h'), '2026-10-28 13:30');
    });

    void test('day anchors snap to the edges of the day', () => {
        assert.strictEqual(resolve('startOfDay'), '2026-10-21 00:00');
        assert.strictEqual(resolve('endOfDay'), '2026-10-21 23:59');
        assert.strictEqual(resolve('startOfDay-1d'), '2026-10-20 00:00');
        assert.strictEqual(resolve('endOfDay+7d'), '2026-10-28 23:59');
    });

    void test('week anchors follow the locale and cross months', () => {
        assert.strictEqual(resolve('startOfWeek'), '2026-10-18 00:00');
        assert.strictEqual(resolve('endOfWeek'), '2026-10-24 23:59');
        assert.strictEqual(resolve('startOfWeek+1w'), '2026-10-25 00:00');
        assert.strictEqual(resolve('startOfWeek', at('2026-10-01 09:00')), '2026-09-27 00:00');
    });

    void test('offsets apply before the anchor snaps', () => {
        assert.strictEqual(resolve('startOfMonth-1m'), '2026-09-01 00:00');
        assert.strictEqual(resolve('endOfMonth-1m'), '2026-09-30 23:59');
        // Shifting first avoids month clamping cutting the 31st off.
        assert.strictEqual(resolve('endOfMonth+1m', at('2026-09-30 12:00')), '2026-10-31 23:59');
        assert.strictEqual(resolve('startOfYear+1y'), '2027-01-01 00:00');
    });

    void test('month offsets clamp to the end of shorter months', () => {
        assert.strictEqual(resolve('startOfDay+1m', at('2026-01-31 10:00')), '2026-02-28 00:00');
        assert.strictEqual(resolve('startOfDay+1m', at('2028-01-31 10:00')), '2028-02-29 00:00');
    });

    void test('does not mutate the moment it is given', () => {
        const base = now();
        resolve('startOfMonth-1m', base);
        assert.strictEqual(base.format(FORMAT), '2026-10-21 15:30');
    });
});

void describe('Date parameters - Expansion', () => {
    void test('expands to a point in time by default', () => {
        assert.strictEqual(expandDateParams('{{now}}', now()), '2026-10-21T15:30:00');
        assert.strictEqual(expandDateParams('{{startOfDay}}', now()), '2026-10-21T00:00:00');
        assert.strictEqual(expandDateParams('{{endOfDay}}', now()), '2026-10-21T23:59:59');
    });

    void test('uses a format after the colon', () => {
        assert.strictEqual(expandDateParams('Journal/{{now:YYYY/MM}}', now()), 'Journal/2026/10');
        assert.strictEqual(expandDateParams('{{startOfMonth-1m:YYYY-MM}}', now()), '2026-09');
        assert.strictEqual(expandDateParams('{{ now : MMMM YYYY }}', now()), 'October 2026');
        assert.strictEqual(expandDateParams('{{now:HH:mm}}', now()), '15:30');
    });

    void test('leaves other placeholders alone', () => {
        for (const text of ['{{this.filename}}', '{{content}}', '{{custom}}', 'now']) {
            assert.strictEqual(expandDateParams(text, now()), text);
        }
    });

    void test('detects date parameters', () => {
        assert.strictEqual(hasDateParams('Journal/{{now:YYYY}}'), true);
        assert.strictEqual(hasDateParams('properties(due < {{startOfDay}})'), true);
        assert.strictEqual(hasDateParams('{{this.folder}}'), false);
        assert.strictEqual(hasDateParams('{{now-0.5h}}'), false);
    });

    void test('expands inside dynamic params and scope', () => {
        assert.strictEqual(expandDynamicParams('contains("{{now:YYYY-MM-DD}}")', null, now()), 'contains("2026-10-21")');
        const config: MocConfig = { folder: 'Journal/{{now:YYYY/MM}}', element: 'List', filter: 'contains("x")' };
        assert.strictEqual(resolveScope(config, null, now()).folderPath, 'Journal/2026/10');
    });
});

void describe('Date parameters - Errors', () => {
    void test('fractional offsets', () => {
        assert.match(findDateParamError('properties(due < {{now-0.5h}})') ?? '', /'\{\{now-0\.5h\}\}': offsets must be whole numbers/);
    });

    void test('unknown units and unreadable offsets', () => {
        assert.match(findDateParamError('{{now-7x}}') ?? '', /unknown unit 'x'/);
        assert.match(findDateParamError('{{now-7}}') ?? '', /unknown unit ''/);
        assert.match(findDateParamError('{{now 7d}}') ?? '', /could not read ' 7d'/);
    });

    void test('misspelt anchors', () => {
        assert.match(findDateParamError('{{startofdya}}') ?? '', /unknown date 'startofdya'/);
        assert.match(findDateParamError('{{endOfFortnight}}') ?? '', /unknown date/);
    });

    void test('whole-day words point to the day anchors', () => {
        assert.match(findDateParamError('{{today}}') ?? '', /'today' is a whole day.*\{\{startOfDay\}\}/);
        assert.match(findDateParamError('{{yesterday:YYYY}}') ?? '', /'yesterday' is a whole day/);
    });

    void test('valid parameters and other placeholders are fine', () => {
        for (const text of ['{{now}}', '{{startOfMonth-1m:YYYY-MM}}', '{{this.filename}}', '{{content}}', 'contains("{{custom}}")', 'plain']) {
            assert.strictEqual(findDateParamError(text), null, text);
        }
    });
});

void describe('Date values', () => {
    void test('a date without a time is local midnight', () => {
        assert.strictEqual(parseDateValue('2026-10-21'), at('2026-10-21 00:00').valueOf());
        assert.strictEqual(parseDateValue('2026-10'), at('2026-10-01 00:00').valueOf());
    });

    void test('datetimes, with and without a zone', () => {
        assert.strictEqual(parseDateValue('2026-10-21T09:15'), at('2026-10-21 09:15').valueOf());
        assert.strictEqual(parseDateValue('2026-10-21 09:15'), at('2026-10-21 09:15').valueOf());
        assert.strictEqual(parseDateValue('2026-10-21T16:00:00Z'), Date.UTC(2026, 9, 21, 16, 0));
    });

    void test('non-dates are not dates', () => {
        for (const value of [2, 2026, '2026', 'today', 'not a date', '2026-02-30', null, undefined, true, ['2026-10-21']]) {
            assert.strictEqual(parseDateValue(value), null, `${JSON.stringify(value)} should not be a date`);
        }
    });

    void test('filename dates are local midnight', () => {
        assert.strictEqual(filenameToTime('2026-10-21'), at('2026-10-21 00:00').valueOf());
        assert.strictEqual(filenameToTime('Standup 2026-10-21 notes'), at('2026-10-21 00:00').valueOf());
        assert.strictEqual(filenameToTime('Ideas'), null);
        assert.strictEqual(filenameToTime('2026-13-01'), null);
    });

    void test('time comparison', () => {
        assert.strictEqual(compareTimes(1, '==', 1), true);
        assert.strictEqual(compareTimes(1, '!=', 1), false);
        assert.strictEqual(compareTimes(1, '<', 2), true);
        assert.strictEqual(compareTimes(2, '<=', 2), true);
        assert.strictEqual(compareTimes(3, '>', 2), true);
        assert.strictEqual(compareTimes(1, '>=', 2), false);
    });
});

void describe('Date parameters - properties() filters', () => {
    const dueToday = 'properties(due >= {{startOfDay}}) AND properties(due <= {{endOfDay}})';

    void test('a date-only property due today is today (UTC regression)', () => {
        // West of UTC, UTC midnight of the 21st is still the 20th locally.
        assert.strictEqual(frontmatterMatches(dueToday, { due: '2026-10-21' }), true);
        assert.strictEqual(frontmatterMatches(dueToday, { due: '2026-10-20' }), false);
        assert.strictEqual(frontmatterMatches(dueToday, { due: '2026-10-22' }), false);
    });

    void test('datetime properties fall inside the day', () => {
        assert.strictEqual(frontmatterMatches(dueToday, { due: '2026-10-21T00:00' }), true);
        assert.strictEqual(frontmatterMatches(dueToday, { due: '2026-10-21T23:30' }), true);
        assert.strictEqual(frontmatterMatches(dueToday, { due: '2026-10-22T00:00' }), false);
    });

    void test('overdue and upcoming', () => {
        assert.strictEqual(frontmatterMatches('properties(due < {{startOfDay}})', { due: '2026-10-20' }), true);
        assert.strictEqual(frontmatterMatches('properties(due < {{startOfDay}})', { due: '2026-10-21' }), false);
        assert.strictEqual(frontmatterMatches('properties(due <= {{endOfDay+7d}})', { due: '2026-10-28' }), true);
        assert.strictEqual(frontmatterMatches('properties(due <= {{endOfDay+7d}})', { due: '2026-10-29' }), false);
    });

    void test('now compares to the minute', () => {
        assert.strictEqual(frontmatterMatches('properties(start >= {{now-2h}})', { start: '2026-10-21T13:30' }), true);
        assert.strictEqual(frontmatterMatches('properties(start >= {{now-2h}})', { start: '2026-10-21T13:29' }), false);
    });

    void test('quoted parameters work too', () => {
        assert.strictEqual(frontmatterMatches('properties(due < "{{startOfDay}}")', { due: '2026-10-20' }), true);
    });

    void test('the word today is just text', () => {
        assert.strictEqual(frontmatterMatches('properties(status == "today")', { status: 'today' }), true);
        assert.strictEqual(frontmatterMatches('properties(due == "today")', { due: '2026-10-21' }), false);
    });

    void test('mixed with element-level filters stays undecided at file level', () => {
        assert.strictEqual(frontmatterMatches('properties(due < {{startOfDay}}) AND contains("x")', { due: '2026-10-20' }), null);
        assert.strictEqual(frontmatterMatches('properties(due < {{startOfDay}}) AND contains("x")', { due: '2026-10-22' }), false);
    });
});

void describe('Fixed dates - one comparison rule', () => {
    void test('date-only against date-only is unchanged', () => {
        assert.strictEqual(frontmatterMatches('properties(due >= "2026-10-01")', { due: '2026-10-21' }), true);
        assert.strictEqual(frontmatterMatches('properties(due == "2026-10-21")', { due: '2026-10-21' }), true);
        assert.strictEqual(frontmatterMatches('properties(due != "2026-10-21")', { due: '2026-10-21' }), false);
        assert.strictEqual(frontmatterMatches('properties(due < 2026-10-21)', { due: '2026-10-20' }), true);
    });

    void test('date-only against datetime treats the date as local midnight', () => {
        assert.strictEqual(frontmatterMatches('properties(meeting >= "2026-10-21")', { meeting: '2026-10-21T03:00' }), true);
        assert.strictEqual(frontmatterMatches('properties(meeting >= "2026-10-21")', { meeting: '2026-10-20T20:00' }), false);
        assert.strictEqual(frontmatterMatches('properties(meeting == "2026-10-21")', { meeting: '2026-10-21T00:00' }), true);
    });

    void test('numbers are not dates', () => {
        assert.strictEqual(frontmatterMatches('properties(year == 2026)', { year: 2026 }), true);
        assert.strictEqual(frontmatterMatches('properties(year > 2025)', { year: 2026 }), true);
    });
});

void describe('Date parameters - file.* keys', () => {
    const ms = (value: string) => at(value).valueOf();

    void test('file.day is midnight of the date in the filename', () => {
        assert.strictEqual(fileMatches('properties(file.day >= {{startOfDay-7d}})', { basename: '2026-10-14' }), true);
        assert.strictEqual(fileMatches('properties(file.day >= {{startOfDay-7d}})', { basename: '2026-10-13' }), false);
        assert.strictEqual(fileMatches('properties(file.day == "2026-10-15")', { basename: 'Standup 2026-10-15' }), true);
    });

    void test('file.day without a date in the filename is false', () => {
        assert.strictEqual(fileMatches('properties(file.day <= {{now}})', { basename: 'Ideas' }), false);
        assert.strictEqual(fileMatches('NOT properties(file.day <= {{now}})', { basename: 'Ideas' }), true);
    });

    void test('file.mtime and file.ctime are exact points in time', () => {
        assert.strictEqual(fileMatches('properties(file.mtime >= {{now-24h}})', { mtime: ms('2026-10-20 16:00') }), true);
        assert.strictEqual(fileMatches('properties(file.mtime >= {{now-24h}})', { mtime: ms('2026-10-20 15:00') }), false);
        assert.strictEqual(fileMatches('properties(file.mtime >= {{startOfDay}})', { mtime: ms('2026-10-21 00:10') }), true);
        assert.strictEqual(fileMatches('properties(file.ctime < {{startOfMonth}})', { ctime: ms('2026-09-30 23:00') }), true);
    });

    void test('file dates work with fixed dates', () => {
        assert.strictEqual(fileMatches('properties(file.mtime >= "2026-01-01")', { mtime: ms('2026-10-21 10:00') }), true);
        assert.strictEqual(fileMatches('properties(file.mtime >= 2027-01-01)', { mtime: ms('2026-10-21 10:00') }), false);
        assert.strictEqual(fileMatches('properties(file.mtime >= "soon")', { mtime: ms('2026-10-21 10:00') }), false);
    });

    void test('file dates need file information', () => {
        assert.strictEqual(frontmatterMatches('properties(file.day <= {{now}})', {}), false);
    });

    void test('dotted keys read ordinary frontmatter too', () => {
        assert.strictEqual(frontmatterMatches('properties(review.next <= {{now}})', { 'review.next': '2026-10-01' }), true);
    });
});

void describe('Date parameters - Refresh', () => {
    void test('knows which blocks use date parameters', () => {
        const base: MocConfig = { folder: 'Notes', element: 'List', filter: 'contains("x")' };
        assert.strictEqual(configUsesDateParams(base), false);
        assert.strictEqual(configUsesDateParams({ ...base, folder: 'Journal/{{now:YYYY}}' }), true);
        assert.strictEqual(configUsesDateParams({ ...base, filter: 'properties(due < {{startOfDay}})' }), true);
        assert.strictEqual(configUsesDateParams({ ...base, filter: 'properties(due <= "2026-12-31")' }), false);
        assert.strictEqual(configUsesDateParams({ ...base, filter: 'contains("{{this.filename}}")' }), false);
    });

    void test('time until the next local midnight', () => {
        assert.strictEqual(msUntilNextDay(moment('2026-10-21 23:59:30', 'YYYY-MM-DD HH:mm:ss')), 30_000);
        assert.strictEqual(msUntilNextDay(moment('2026-10-21 00:00:00', 'YYYY-MM-DD HH:mm:ss')), 24 * 60 * 60 * 1000);
    });
});
