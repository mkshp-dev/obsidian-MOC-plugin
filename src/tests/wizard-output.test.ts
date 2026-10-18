import assert from 'node:assert';
import { test, describe } from 'node:test';
import { compileDateParameter, compileDatePreset, compileFilterTree, createDefaultFilterGroup, createDefaultFilterRule, FilterRuleNode, getFilterValidationMessage } from '../ui/moc-filter-builder';
import { toYamlString } from '../utils/yaml';
import { hasDateParams } from '../relative-dates';
import { findParameterError } from '../parameters';
import { parseFilter } from '../moc';

function dateRule(overrides: Partial<FilterRuleNode>): FilterRuleNode {
    return {
        ...createDefaultFilterRule(),
        kind: 'properties',
        propertyKey: 'due',
        propertyType: 'date',
        operator: '<=',
        dateMode: 'relative',
        ...overrides,
    };
}

function compileRule(rule: FilterRuleNode): string | null {
    const group = createDefaultFilterGroup();
    group.children = [rule];
    return compileFilterTree(group);
}

/** A compiled filter must be a valid block filter once its date parameters are expanded. */
function assertValidFilter(filter: string) {
    assert.strictEqual(findParameterError(filter, 'filter'), null, filter);
    assert.ok(hasDateParams(filter), filter);
    assert.ok(parseFilter(filter.replace(/\{\{[^}]*\}\}/g, '2026-10-21')), filter);
}

void describe('Wizard - Relative dates', () => {
    void test('builds date parameters', () => {
        assert.strictEqual(compileDateParameter('now', '', 'd'), '{{now}}');
        assert.strictEqual(compileDateParameter('startOfDay', '0', 'd'), '{{startOfDay}}');
        assert.strictEqual(compileDateParameter('startOfDay', '-7', 'd'), '{{startOfDay-7d}}');
        assert.strictEqual(compileDateParameter('now', '-2', 'h'), '{{now-2h}}');
        assert.strictEqual(compileDateParameter('startOfMonth', '1', 'm'), '{{startOfMonth+1m}}');
    });

    void test('compiles to a valid filter', () => {
        const compiled = compileRule(dateRule({ relativeAnchor: 'endOfDay', relativeOffset: '7', relativeUnit: 'd' }));
        assert.strictEqual(compiled, 'properties(due <= {{endOfDay+7d}})');
        assertValidFilter(compiled!);
    });

    void test('works for file dates', () => {
        const compiled = compileRule(dateRule({ propertyKey: 'file.mtime', operator: '>=', relativeAnchor: 'now', relativeOffset: '-24', relativeUnit: 'h' }));
        assert.strictEqual(compiled, 'properties(file.mtime >= {{now-24h}})');
        assertValidFilter(compiled!);
    });

    void test('needs no fixed value but rejects fractional offsets', () => {
        const group = createDefaultFilterGroup();
        group.children = [dateRule({ value: '' })];
        assert.strictEqual(getFilterValidationMessage(group), null);

        group.children = [dateRule({ relativeOffset: '1.5' })];
        assert.strictEqual(getFilterValidationMessage(group), 'Relative date offsets must be whole numbers.');
        assert.strictEqual(compileFilterTree(group), null);
    });

    void test('fixed mode and non-date types are unchanged', () => {
        assert.strictEqual(compileRule(dateRule({ dateMode: 'fixed', value: '2026-10-21' })), 'properties(due <= "2026-10-21")');
        assert.strictEqual(compileRule(dateRule({ propertyType: 'text', operator: '==', value: 'x' })), 'properties(due == "x")');
        // A text property ignores a leftover date mode.
        assert.strictEqual(compileRule(dateRule({ propertyType: 'text', datePreset: 'today', operator: '==', value: 'x' })), 'properties(due == "x")');
    });
});

void describe('Wizard - Date presets', () => {
    void test('ranges expand to two comparisons', () => {
        assert.strictEqual(compileDatePreset('due', 'today'), '(properties(due >= {{startOfDay}}) AND properties(due <= {{endOfDay}}))');
        assert.strictEqual(compileDatePreset('due', 'next7Days'), '(properties(due >= {{startOfDay}}) AND properties(due <= {{endOfDay+7d}}))');
    });

    void test('one-sided presets expand to one comparison', () => {
        assert.strictEqual(compileDatePreset('due', 'beforeToday'), 'properties(due < {{startOfDay}})');
        assert.strictEqual(compileDatePreset('due', 'afterToday'), 'properties(due > {{endOfDay}})');
    });

    void test('every preset compiles to a valid filter', () => {
        for (const preset of ['today', 'thisWeek', 'thisMonth', 'thisYear', 'beforeToday', 'afterToday', 'past7Days', 'next7Days'] as const) {
            assertValidFilter(compileRule(dateRule({ datePreset: preset }))!);
        }
    });

    void test('a range keeps its meaning inside other groups', () => {
        const group = createDefaultFilterGroup();
        group.mode = 'any';
        group.children = [
            { ...createDefaultFilterRule(), kind: 'contains', value: 'urgent' },
            dateRule({ datePreset: 'today' }),
        ];
        const compiled = compileFilterTree(group);
        assert.strictEqual(compiled, 'contains("urgent") OR (properties(due >= {{startOfDay}}) AND properties(due <= {{endOfDay}}))');
        assertValidFilter(compiled!);
    });

    void test('presets need only a property', () => {
        const group = createDefaultFilterGroup();
        group.children = [dateRule({ datePreset: 'thisWeek', value: '' })];
        assert.strictEqual(getFilterValidationMessage(group), null);
        group.children = [dateRule({ datePreset: 'today', propertyKey: ' ' })];
        assert.strictEqual(compileFilterTree(group), null);
    });
});

void describe('Wizard - Presets in the operator menu', () => {
    void test('choosing a preset replaces the comparison, clearing it brings the comparison back', () => {
        const rule = dateRule({ operator: '<=', relativeAnchor: 'endOfDay', relativeOffset: '7', relativeUnit: 'd' });
        assert.strictEqual(compileRule(rule), 'properties(due <= {{endOfDay+7d}})');

        rule.datePreset = 'thisWeek';
        assert.strictEqual(compileRule(rule), 'properties(due >= {{startOfWeek}}) AND properties(due <= {{endOfWeek}})');

        rule.datePreset = null;
        assert.strictEqual(compileRule(rule), 'properties(due <= {{endOfDay+7d}})');
    });

    void test('a picked date and time compiles as a fixed value', () => {
        const rule = dateRule({ propertyKey: 'file.mtime', propertyType: 'datetime', operator: '>=', dateMode: 'fixed', value: '2026-10-21T09:30' });
        assert.strictEqual(compileRule(rule), 'properties(file.mtime >= "2026-10-21T09:30")');
    });
});

void describe('Wizard - YAML values', () => {
    void test('leaves plain values unquoted', () => {
        assert.strictEqual(toYamlString('Projects/Work'), 'Projects/Work');
        assert.strictEqual(toYamlString('Journal/{{now:YYYY/MM}}'), 'Journal/{{now:YYYY/MM}}');
        assert.strictEqual(toYamlString('is_incomplete() AND properties(due <= {{endOfDay}})'), 'is_incomplete() AND properties(due <= {{endOfDay}})');
        assert.strictEqual(toYamlString('has_tag("#idea")'), 'has_tag("#idea")');
    });

    void test('quotes values YAML would misread', () => {
        for (const value of [
            '',                    // null
            '{{this.folder}}',     // a mapping
            '{{now:YYYY/MM}}',
            '2026',                // a number
            '1.5',
            'true',                // a boolean
            'null',
            'contains("a: b")',    // a key
            'contains(" #tag")',   // a comment
            '#tag',
            ' padded ',
        ]) {
            const formatted = toYamlString(value);
            assert.ok(formatted.startsWith('"'), `'${value}' should be quoted`);
            // JSON strings are valid double-quoted YAML, so this is how YAML reads it back.
            assert.strictEqual(JSON.parse(formatted), value);
        }
    });

    void test('escapes quotes inside quoted values', () => {
        const value = '{{x}} contains("say \\"hi\\"")';
        assert.strictEqual(JSON.parse(toYamlString(value)), value);
    });
});
