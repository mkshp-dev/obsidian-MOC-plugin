export type FilterGroupMode = 'all' | 'any' | 'none';

export type FilterRuleKind =
    | 'contains'
    | 'matches'
    | 'has_tag'
    | 'is_completed'
    | 'is_incomplete'
    | 'properties';

export type FilterPropertyOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

export type FilterPropertyValueType = 'text' | 'number' | 'date' | 'datetime' | 'checkbox';

/** How the value of a date comparison is given: a picked date, or a moment relative to now. */
export type FilterDateMode = 'fixed' | 'relative';

export type FilterRelativeUnit = 'h' | 'd' | 'w' | 'm' | 'y';

/**
 * Wizard shortcuts for common ranges. They exist only here: each compiles to
 * explicit comparisons against date parameters, so blocks stay readable
 * without knowing about presets.
 */
export type FilterDatePreset =
    | 'today'
    | 'thisWeek'
    | 'thisMonth'
    | 'thisYear'
    | 'beforeToday'
    | 'afterToday'
    | 'past7Days'
    | 'next7Days';

/** Each preset as `[operator, date expression]` pairs that must all hold. */
const DATE_PRESETS: Record<FilterDatePreset, [FilterPropertyOperator, string][]> = {
    today: [['>=', 'startOfDay'], ['<=', 'endOfDay']],
    thisWeek: [['>=', 'startOfWeek'], ['<=', 'endOfWeek']],
    thisMonth: [['>=', 'startOfMonth'], ['<=', 'endOfMonth']],
    thisYear: [['>=', 'startOfYear'], ['<=', 'endOfYear']],
    beforeToday: [['<', 'startOfDay']],
    afterToday: [['>', 'endOfDay']],
    past7Days: [['>=', 'startOfDay-7d'], ['<=', 'endOfDay']],
    next7Days: [['>=', 'startOfDay'], ['<=', 'endOfDay+7d']],
};

export function isDatePreset(value: string): value is FilterDatePreset {
    return value in DATE_PRESETS;
}

export interface FilterRuleNode {
    nodeType: 'rule';
    id: string;
    kind: FilterRuleKind;
    propertyKey: string;
    propertyType: FilterPropertyValueType;
    operator: FilterPropertyOperator;
    value: string;
    dateMode: FilterDateMode;
    /** A date anchor as written in blocks, such as `now` or `startOfWeek`. */
    relativeAnchor: string;
    /** Signed whole number; empty or zero means no offset. */
    relativeOffset: string;
    relativeUnit: FilterRelativeUnit;
    /**
     * Chosen from the operator menu in place of a comparison. While set, it
     * stands for the operator and the value together, which keep their
     * previous settings for when the preset is cleared again.
     */
    datePreset: FilterDatePreset | null;
}

export interface FilterGroupNode {
    nodeType: 'group';
    id: string;
    mode: FilterGroupMode;
    children: FilterBuilderNode[];
}

export type FilterBuilderNode = FilterRuleNode | FilterGroupNode;

let nextFilterNodeId = 0;

function createFilterNodeId(): string {
    nextFilterNodeId += 1;
    return `filter-node-${nextFilterNodeId}`;
}

export function createDefaultFilterRule(): FilterRuleNode {
    return {
        nodeType: 'rule',
        id: createFilterNodeId(),
        kind: 'contains',
        propertyKey: '',
        propertyType: 'text',
        operator: '==',
        value: '',
        dateMode: 'fixed',
        relativeAnchor: 'startOfDay',
        relativeOffset: '',
        relativeUnit: 'd',
        datePreset: null,
    };
}

export function isDatePropertyType(type: FilterPropertyValueType): boolean {
    return type === 'date' || type === 'datetime';
}

function isDateRule(rule: FilterRuleNode): boolean {
    return rule.kind === 'properties' && isDatePropertyType(rule.propertyType);
}

/** The preset a rule uses, ignoring a leftover one on a rule that is no longer about a date. */
function presetOf(rule: FilterRuleNode): FilterDatePreset | null {
    return isDateRule(rule) ? rule.datePreset : null;
}

function dateModeOf(rule: FilterRuleNode): FilterDateMode {
    return isDateRule(rule) ? rule.dateMode : 'fixed';
}

function parseRelativeOffset(raw: string): number | null {
    if (raw.trim() === '') return 0;
    const amount = Number(raw);
    return Number.isInteger(amount) ? amount : null;
}

/** Builds a date parameter such as `{{startOfDay-7d}}`, leaving out a zero or empty offset. */
export function compileDateParameter(anchor: string, offset: string, unit: FilterRelativeUnit): string {
    const amount = parseRelativeOffset(offset);
    const shift = amount ? `${amount > 0 ? '+' : ''}${amount}${unit}` : '';
    return `{{${anchor}${shift}}}`;
}

/** Expands a preset into its comparisons, parenthesised when it is a range. */
export function compileDatePreset(propertyKey: string, preset: FilterDatePreset): string {
    const comparisons = DATE_PRESETS[preset].map(([operator, expression]) => `properties(${propertyKey} ${operator} {{${expression}}})`);
    return comparisons.length === 1 ? comparisons[0]! : `(${comparisons.join(' AND ')})`;
}

export function createDefaultFilterGroup(): FilterGroupNode {
    return {
        nodeType: 'group',
        id: createFilterNodeId(),
        mode: 'all',
        children: [createDefaultFilterRule()],
    };
}

export function escapeFilterValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function compileFilterNode(node: FilterBuilderNode): string | null {
    if (node.nodeType === 'rule') {
        return compileFilterRule(node);
    }

    const childFilters = node.children
        .map(child => compileFilterNode(child))
        .filter((child): child is string => child !== null);

    if (childFilters.length === 0) {
        return null;
    }

    const joiner = node.mode === 'all' ? ' AND ' : ' OR ';
    const joined = childFilters.join(joiner);

    if (node.mode === 'none') {
        return `NOT (${joined})`;
    }

    return childFilters.length === 1 ? joined : `(${joined})`;
}

export function compileFilterTree(root: FilterGroupNode): string | null {
    const compiled = compileFilterNode(root);
    if (!compiled) {
        return null;
    }

    if (root.mode !== 'none' && compiled.startsWith('(') && compiled.endsWith(')')) {
        return compiled.slice(1, -1);
    }

    return compiled;
}

export function getFilterValidationMessage(root: FilterGroupNode): string | null {
    return findInvalidFilterNode(root);
}

function compileFilterRule(rule: FilterRuleNode): string | null {
    if (rule.kind === 'is_completed' || rule.kind === 'is_incomplete') {
        return `${rule.kind}()`;
    }

    if (rule.kind === 'properties') {
        const propertyKey = rule.propertyKey.trim();
        const preset = presetOf(rule);
        if (preset) {
            return propertyKey ? compileDatePreset(propertyKey, preset) : null;
        }
        if (dateModeOf(rule) === 'relative') {
            if (!propertyKey || parseRelativeOffset(rule.relativeOffset) === null) {
                return null;
            }
            const parameter = compileDateParameter(rule.relativeAnchor, rule.relativeOffset, rule.relativeUnit);
            return `properties(${propertyKey} ${rule.operator} ${parameter})`;
        }
        if (!propertyKey || !rule.value) {
            return null;
        }
        return `properties(${propertyKey} ${rule.operator} ${compilePropertyValue(rule)})`;
    }

    if (!rule.value) {
        return null;
    }

    return `${rule.kind}("${escapeFilterValue(rule.value)}")`;
}

function compilePropertyValue(rule: FilterRuleNode): string {
    if (rule.propertyType === 'number' || rule.propertyType === 'checkbox') {
        return rule.value;
    }

    return `"${escapeFilterValue(rule.value)}"`;
}

function findInvalidFilterNode(node: FilterBuilderNode): string | null {
    if (node.nodeType === 'group') {
        if (node.children.length === 0) {
            return 'Each filter group needs at least one filter.';
        }

        for (const child of node.children) {
            const childMessage = findInvalidFilterNode(child);
            if (childMessage) {
                return childMessage;
            }
        }

        return null;
    }

    if (node.kind === 'properties') {
        if (!node.propertyKey.trim()) {
            return 'Property filters need a property key.';
        }
        if (presetOf(node)) {
            return null;
        }
        if (dateModeOf(node) === 'relative') {
            return parseRelativeOffset(node.relativeOffset) === null
                ? 'Relative date offsets must be whole numbers.'
                : null;
        }
        if (!node.value) {
            return 'Property filters need a value.';
        }
    } else if (node.kind !== 'is_completed' && node.kind !== 'is_incomplete' && !node.value) {
        return 'Text, regex, and tag filters need a value.';
    }

    return null;
}
