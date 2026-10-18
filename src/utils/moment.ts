import { moment as obsidianMoment } from 'obsidian';
import type { Moment, MomentFormatSpecification, MomentInput } from 'moment';

export type { Moment };

/** The parts of moment the plugin calls, as the function it is at runtime. */
interface MomentFunction {
    (input?: MomentInput, format?: MomentFormatSpecification, strict?: boolean): Moment;
    readonly ISO_8601: MomentFormatSpecification;
}

/**
 * Obsidian's bundled `moment`, typed so it stays callable under any TypeScript
 * version. Use this rather than importing `moment` from 'obsidian'.
 *
 * Obsidian declares `moment` through a namespace import of the moment package.
 * TypeScript 6 always enables `esModuleInterop`, under which a namespace
 * import has no call signature, so every `moment()` call stops type-checking
 * and everything it returns has a type that cannot be resolved. The value is
 * the same function either way; only its declared type changes here.
 */
export const moment = obsidianMoment as unknown as MomentFunction;
