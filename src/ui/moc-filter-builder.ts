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

export interface FilterRuleNode {
    nodeType: 'rule';
    id: string;
    kind: FilterRuleKind;
    propertyKey: string;
    propertyType: FilterPropertyValueType;
    operator: FilterPropertyOperator;
    value: string;
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
    };
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
        if (!node.value) {
            return 'Property filters need a value.';
        }
    } else if (node.kind !== 'is_completed' && node.kind !== 'is_incomplete' && !node.value) {
        return 'Text, regex, and tag filters need a value.';
    }

    return null;
}
