import { parseDateParam } from './relative-dates';

/** The `{{this.…}}` parameters a block can use, filled from the note it lives in. */
export const THIS_PARAMETERS = ['{{this.filename}}', '{{this.folder}}', '{{this.path}}'];

/**
 * Where a value is used. Every `{{…}}` is a parameter in both; this only
 * changes the advice in an error, since searching for literal text is
 * something a filter does and a path does not.
 */
export type ParameterContext = 'path' | 'filter';

const PARAMETER_PATTERN = /\{\{([^{}]*)\}\}/g;

function listOf(items: string[]): string {
    return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
}

/** A regex matching `text` literally, with braces escaped so it is not read as a parameter. */
function literalPattern(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/**
 * Describes the first `{{…}}` in `text` that cannot be replaced, or returns null.
 *
 * Every `{{…}}` is a parameter the plugin provides, so one it does not know is
 * always a mistake rather than text to keep. Notes can still be searched for
 * literal braces with an escaped regex, which the error suggests.
 */
export function findParameterError(text: string, context: ParameterContext): string | null {
    for (const match of text.match(PARAMETER_PATTERN) ?? []) {
        const body = match.slice(2, -2);

        if (/^\s*this\./i.test(body)) {
            if (!THIS_PARAMETERS.includes(match)) {
                return `Error: unknown parameter '${match}'. Use ${listOf(THIS_PARAMETERS)}.`;
            }
            continue;
        }

        const date = parseDateParam(body);
        if (date.kind === 'invalid') {
            return `Error: invalid date parameter '${match}': ${date.reason}`;
        }
        if (date.kind === 'other') {
            const search = context === 'filter'
                ? ` To search for the text itself, use matches("${literalPattern(match)}").`
                : '';
            return `Error: unknown parameter '${match}'. Use ${listOf(THIS_PARAMETERS)}, or a date parameter such as {{startOfDay}}.${search}`;
        }
    }
    return null;
}

/**
 * Explains a filter that does not parse. When parameters were replaced, it
 * shows the text that actually failed, since that is what needs fixing: a
 * replaced value with spaces in it, for instance, has to be quoted.
 */
export function describeFilterError(filter: string, expandedFilter: string): string {
    if (expandedFilter === filter) {
        return `Error: unsupported or invalid filter format '${filter}'.`;
    }
    return `Error: invalid filter after replacing parameters: '${expandedFilter}'. ` +
        'If a replaced value contains spaces or brackets, put it in quotes, as in properties(month == "{{now:MMMM YYYY}}").';
}
