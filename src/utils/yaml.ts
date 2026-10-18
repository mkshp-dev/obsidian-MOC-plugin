/**
 * Formats a string as a YAML value that always reads back as that same string.
 *
 * Plain values stay unquoted for readability. Anything YAML would read
 * differently is double-quoted instead: an empty value (read as null), a
 * leading `{` such as `{{now:YYYY}}` (read as a mapping), `: ` or ` #`
 * (a key or a comment), and words or numbers like `true` or `2026` that
 * would stop being strings. JSON string syntax is valid double-quoted YAML.
 */
export function toYamlString(value: string): string {
    const needsQuotes =
        value === '' ||
        value !== value.trim() ||
        /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
        /: | #|:$/.test(value) ||
        /^(?:true|false|yes|no|on|off|null|~)$/i.test(value) ||
        /^[-+]?(?:\d[\d_]*)?\.?\d+(?:[eE][-+]?\d+)?$/.test(value) ||
        /^0[xo][0-9a-fA-F]+$/.test(value);

    return needsQuotes ? JSON.stringify(value) : value;
}
