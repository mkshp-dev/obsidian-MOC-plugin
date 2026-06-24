import assert from 'node:assert';
import { test, describe } from 'node:test';
import { parseFilter, evaluateFilter, evaluateFrontmatter } from '../moc';

void describe('MOC Filter - Primitive Filters', () => {
    void test('has_word(...)', () => {
        const filter = parseFilter('has_word("hello")');
        assert.ok(filter, 'Filter should parse');

        // has_word currently uses includes() under the hood
        assert.strictEqual(evaluateFilter('say hello world', filter), true);
        assert.strictEqual(evaluateFilter('hello', filter), true);
        assert.strictEqual(evaluateFilter('goodbye', filter), false);
    });

    void test('contains(...)', () => {
        const filter = parseFilter('contains("plan")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('The plan is simple', filter), true);
        assert.strictEqual(evaluateFilter('No strategy here', filter), false);
    });

    void test('has_text(...)', () => {
        const filter = parseFilter('has_text("some text")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('Here is some text to match', filter), true);
        assert.strictEqual(evaluateFilter('No text here', filter), false);
    });

    void test('matches(...)', () => {
        const filter = parseFilter('matches("^[A-Z]+")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('HELLO world', filter), true);
        assert.strictEqual(evaluateFilter('hello WORLD', filter), false); // Does not start with capital
    });

    void test('has_tag(...)', () => {
        const filter = parseFilter('has_tag("#project")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('This is a #project task', filter), true);
        assert.strictEqual(evaluateFilter('No tags here', filter), false);
    });

    void test('is_completed(...)', () => {
        const filter = parseFilter('is_completed()');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('Some task', filter, true), true); // isCompletedTask = true
        assert.strictEqual(evaluateFilter('Some task', filter, false), false); // isCompletedTask = false
        assert.strictEqual(evaluateFilter('Some text', filter, undefined), false); // No task info
    });

    void test('is_incomplete(...)', () => {
        const filter = parseFilter('is_incomplete()');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('Some task', filter, false), true); // isCompletedTask = false
        assert.strictEqual(evaluateFilter('Some task', filter, true), false); // isCompletedTask = true
        assert.strictEqual(evaluateFilter('Some text', filter, undefined), false); // No task info
    });
});

void describe('MOC Filter - Boolean Composition', () => {
    void test('AND operator', () => {
        const filter = parseFilter('has_word("apple") AND has_word("banana")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('apple and banana', filter), true);
        assert.strictEqual(evaluateFilter('only apple', filter), false);
        assert.strictEqual(evaluateFilter('neither', filter), false);
    });

    void test('OR operator', () => {
        const filter = parseFilter('has_word("apple") OR has_word("banana")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('apple is here', filter), true);
        assert.strictEqual(evaluateFilter('banana is here', filter), true);
        assert.strictEqual(evaluateFilter('neither', filter), false);
    });

    void test('NOT operator', () => {
        const filter = parseFilter('NOT has_word("apple")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('banana is here', filter), true);
        assert.strictEqual(evaluateFilter('apple is here', filter), false);
    });

    void test('Nested parentheses', () => {
        const filter = parseFilter('(has_word("apple") OR has_word("banana")) AND has_word("orange")');
        assert.ok(filter);
        assert.strictEqual(evaluateFilter('apple and orange', filter), true);
        assert.strictEqual(evaluateFilter('banana and orange', filter), true);
        assert.strictEqual(evaluateFilter('apple and banana', filter), false); // missing orange
        assert.strictEqual(evaluateFilter('only orange', filter), false); // missing apple/banana
    });

    void test('Precedence without parentheses (NOT > AND > OR)', () => {
        // According to our parser, NOT binds tightest, then AND, then OR
        const filter = parseFilter('has_word("apple") OR has_word("banana") AND NOT has_word("orange")');
        assert.ok(filter);

        // apple OR (banana AND (NOT orange))
        assert.strictEqual(evaluateFilter('apple and orange', filter), true); // matches left of OR
        assert.strictEqual(evaluateFilter('banana', filter), true); // right side matches (banana AND NOT orange)
        assert.strictEqual(evaluateFilter('banana and orange', filter), false); // right side fails, left fails
    });
});

void describe('MOC Filter - Property/Frontmatter Evaluation', () => {
    void test('Matching property value', () => {
        const filter = parseFilter('properties(status == "active")');
        assert.ok(filter);
        assert.strictEqual(evaluateFrontmatter({ status: "active" }, filter), true);
    });

    void test('Non-matching property value', () => {
        const filter = parseFilter('properties(status == "active")');
        assert.ok(filter);
        assert.strictEqual(evaluateFrontmatter({ status: "archived" }, filter), false);
    });

    void test('Missing property behavior', () => {
        const filter = parseFilter('properties(status == "active")');
        assert.ok(filter);
        assert.strictEqual(evaluateFrontmatter({}, filter), false); // property missing
        assert.strictEqual(evaluateFrontmatter(null, filter), false); // frontmatter missing
    });

    void test('String quoting handling', () => {
        const filter1 = parseFilter('properties(status == "in progress")');
        assert.ok(filter1);
        assert.strictEqual(evaluateFrontmatter({ status: "in progress" }, filter1), true);

        const filter2 = parseFilter("properties(status == 'done')");
        assert.ok(filter2);
        assert.strictEqual(evaluateFrontmatter({ status: "done" }, filter2), true);

        const filter3 = parseFilter("properties(status == done)"); // unquoted
        assert.ok(filter3);
        assert.strictEqual(evaluateFrontmatter({ status: "done" }, filter3), true);
    });

    void test('Boolean composition with frontmatter', () => {
        const filter = parseFilter('properties(status == "active") AND properties(priority == "high")');
        assert.ok(filter);
        assert.strictEqual(evaluateFrontmatter({ status: "active", priority: "high" }, filter), true);
        assert.strictEqual(evaluateFrontmatter({ status: "active", priority: "low" }, filter), false);
    });
});

void describe('MOC Filter - Malformed Filter Handling', () => {
    void test('Unbalanced parentheses', () => {
        // Missing closing parenthesis
        assert.strictEqual(parseFilter('(has_word("apple") AND has_word("banana")'), null);

        // Missing opening parenthesis
        assert.strictEqual(parseFilter('has_word("apple"))'), null);
    });

    void test('Malformed boolean expression', () => {
        // Trailing AND
        assert.strictEqual(parseFilter('has_word("apple") AND'), null);

        // Missing operator
        assert.strictEqual(parseFilter('has_word("apple") has_word("banana")'), null);
    });

    void test('Malformed properties(...) expression', () => {
        // Missing closing parenthesis
        assert.strictEqual(parseFilter('properties(status == "active"'), null);

        // Missing ==
        assert.strictEqual(parseFilter('properties(status "active")'), null);

        // Missing property name
        assert.strictEqual(parseFilter('properties( == "active")'), null);
    });

    void test('Unknown function / operator name', () => {
        assert.strictEqual(parseFilter('is_something_else()'), null);
        assert.strictEqual(parseFilter('has_magic("wand")'), null);
    });

    void test('Empty expression', () => {
        assert.strictEqual(parseFilter(''), null);
        assert.strictEqual(parseFilter('   '), null);
    });
});
