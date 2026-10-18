import assert from 'node:assert';
import { test, describe } from 'node:test';
import { moment, TFile } from 'obsidian';
import { describeFilterError, findParameterError } from '../parameters';
import { configUsesDateParams, evaluateFilter, findConfigParameterError, isPathInScope, MocConfig, parseFilter, resolveScope } from '../moc';

const now = () => moment('2026-10-21 15:30', 'YYYY-MM-DD HH:mm');

/** The note a block lives in, with just the fields parameters read. */
const host = { basename: 'Alpha', path: 'Projects/Alpha.md', parent: { name: 'Projects' } } as unknown as TFile;

const base: MocConfig = { folder: 'Notes', element: 'List', filter: 'contains("x")' };

void describe('Parameters - Date mistakes', () => {
    void test('fractional offsets', () => {
        assert.match(findParameterError('properties(due < {{now-0.5h}})', 'filter') ?? '', /invalid date parameter '\{\{now-0\.5h\}\}': offsets must be whole numbers/);
    });

    void test('unknown units and unreadable offsets', () => {
        assert.match(findParameterError('{{now-7x}}', 'filter') ?? '', /unknown unit 'x'/);
        assert.match(findParameterError('{{now-7}}', 'filter') ?? '', /unknown unit ''/);
        assert.match(findParameterError('{{now 7d}}', 'filter') ?? '', /could not read ' 7d'/);
    });

    void test('misspelt anchors', () => {
        assert.match(findParameterError('{{startofdya}}', 'filter') ?? '', /unknown date 'startofdya'/);
        assert.match(findParameterError('{{endOfFortnight}}', 'path') ?? '', /unknown date/);
    });

    void test('whole-day words point to the day anchors', () => {
        assert.match(findParameterError('{{today}}', 'filter') ?? '', /'today' is a whole day.*\{\{startOfDay\}\}/);
        assert.match(findParameterError('{{yesterday:YYYY}}', 'path') ?? '', /'yesterday' is a whole day/);
    });
});

void describe('Parameters - Note parameters', () => {
    void test('known ones are fine everywhere', () => {
        for (const text of ['{{this.filename}}', 'Projects/{{this.folder}}', 'contains("{{this.path}}")']) {
            assert.strictEqual(findParameterError(text, 'path'), null, text);
            assert.strictEqual(findParameterError(text, 'filter'), null, text);
        }
    });

    void test('unknown ones are reported, even in filters', () => {
        for (const text of ['{{this.filname}}', 'contains("{{this.name}}")', '{{ this.filename }}', '{{this.Filename}}']) {
            const error = findParameterError(text, 'filter') ?? '';
            assert.match(error, /unknown parameter/, text);
            assert.match(error, /\{\{this\.filename\}\}, \{\{this\.folder\}\} or \{\{this\.path\}\}/, text);
        }
    });
});

void describe('Parameters - Unrecognised braces', () => {
    void test('are errors in paths, without search advice', () => {
        const error = findParameterError('Journal/{{nwo:YYYY}}', 'path') ?? '';
        assert.match(error, /unknown parameter '\{\{nwo:YYYY\}\}'/);
        assert.match(error, /\{\{startOfDay\}\}/);
        assert.doesNotMatch(error, /matches/);
    });

    void test('are errors in filters too, with a literal search to use instead', () => {
        const error = findParameterError('contains("{{title}}")', 'filter') ?? '';
        assert.match(error, /unknown parameter '\{\{title\}\}'/);
        assert.ok(error.includes('use matches("\\{\\{title\\}\\}")'), error);
        assert.match(findParameterError('contains("{{content}}")', 'filter') ?? '', /unknown parameter/);
    });

    void test('the suggested search finds the literal text and is not itself a parameter', () => {
        const error = findParameterError('contains("{{my.title}}")', 'filter') ?? '';
        const suggestion = error.match(/use (matches\(".*"\))\.$/)?.[1];
        assert.ok(suggestion, error);
        assert.strictEqual(findParameterError(suggestion, 'filter'), null);
        const parsed = parseFilter(suggestion);
        assert.ok(parsed);
        assert.strictEqual(evaluateFilter('Fill in {{my.title}} here', parsed), true);
        assert.strictEqual(evaluateFilter('Fill in {{myxtitle}} here', parsed), false);
    });

    void test('escaped braces in a regex are not parameters', () => {
        assert.strictEqual(findParameterError('matches("\\{\\{.*\\}\\}")', 'filter'), null);
    });

    void test('plain text has no parameters', () => {
        assert.strictEqual(findParameterError('Projects/Work', 'path'), null);
        assert.strictEqual(findParameterError('contains("now")', 'filter'), null);
    });
});

void describe('Parameters - Whole blocks', () => {
    void test('checks the folder, both exclusions and the filter', () => {
        assert.strictEqual(findConfigParameterError(base), null);
        assert.match(findConfigParameterError({ ...base, folder: 'Notes/{{this.fodler}}' }) ?? '', /\{\{this\.fodler\}\}/);
        assert.match(findConfigParameterError({ ...base, excludeFolder: 'Archive/{{now-1.5y:YYYY}}' }) ?? '', /whole numbers/);
        assert.match(findConfigParameterError({ ...base, excludeFile: ['Inbox/scratch', '{{nope}}'] }) ?? '', /\{\{nope\}\}/);
        assert.match(findConfigParameterError({ ...base, filter: 'contains("{{this.nam}}")' }) ?? '', /\{\{this\.nam\}\}/);
    });

    void test('reports the folder before the filter', () => {
        const config = { ...base, folder: '{{bad}}', filter: '{{today}}' };
        assert.match(findConfigParameterError(config) ?? '', /\{\{bad\}\}/);
    });
});

void describe('Parameters - Exclusions', () => {
    void test('date and note parameters are replaced in exclusions', () => {
        const config: MocConfig = {
            ...base,
            folder: 'Journal',
            recursive: true,
            excludeFolder: ['Journal/{{now:YYYY}}', 'Journal/{{this.filename}}'],
            excludeFile: 'Journal/{{startOfDay-1d:YYYY-MM-DD}}'
        };
        const scope = resolveScope(config, host, now());
        assert.deepStrictEqual(scope.excludeFolders, ['Journal/2026', 'Journal/Alpha']);
        assert.deepStrictEqual(scope.excludeFiles, ['Journal/2026-10-20']);
        assert.strictEqual(isPathInScope('Journal/2026/10/Note.md', scope), false);
        assert.strictEqual(isPathInScope('Journal/2025/Note.md', scope), true);
        assert.strictEqual(isPathInScope('Journal/2026-10-20.md', scope), false);
    });

    void test('a date in an exclusion refreshes the block on a new day', () => {
        assert.strictEqual(configUsesDateParams({ ...base, excludeFolder: 'Archive/{{now:YYYY}}' }), true);
        assert.strictEqual(configUsesDateParams({ ...base, excludeFile: ['a', 'b/{{startOfMonth:YYYY-MM}}'] }), true);
        assert.strictEqual(configUsesDateParams({ ...base, excludeFolder: 'Archive' }), false);
    });
});

void describe('Parameters - Filter errors', () => {
    void test('an unchanged filter keeps the plain message', () => {
        assert.strictEqual(describeFilterError('contains(x)', 'contains(x)'), "Error: unsupported or invalid filter format 'contains(x)'.");
    });

    void test('a filter changed by parameters shows the text that failed', () => {
        const error = describeFilterError('properties(month == {{now:MMMM YYYY}})', 'properties(month == October 2026)');
        assert.match(error, /after replacing parameters: 'properties\(month == October 2026\)'/);
        assert.match(error, /put it in quotes/);
    });
});
