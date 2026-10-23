import { createHash } from "node:crypto";

interface IdempotencyEntry<T> {
  requestDigest: string;
  expiresAt: number;
  response: Promise<T>;
}

export type IdempotencyOutcome<T> =
  | { status: "created" | "replayed"; response: T }
  | { status: "conflict" };

const ENTRY_TTL_MS = 15 * 60 * 1_000;
const MAX_ENTRIES = 500;

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * Process-local idempotency for non-persistent demo requests. It stores only a
 * request digest (not the submitted buyer text) and expires entries after 15 min.
 */
export class InMemoryIdempotencyStore<T> {
  private readonly entries = new Map<string, IdempotencyEntry<T>>();

  async run(
    key: string,
    request: unknown,
    create: () => Promise<T> | T,
  ): Promise<IdempotencyOutcome<T>> {
    this.removeExpired(Date.now());
    const requestDigest = digest(request);
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.requestDigest !== requestDigest) {
        return { status: "conflict" };
      }
      return {
        status: "replayed",
        response: structuredClone(await existing.response),
      };
    }

    const response = Promise.resolve().then(create);
    this.entries.set(key, {
      requestDigest,
      expiresAt: Date.now() + ENTRY_TTL_MS,
      response,
    });
    this.removeOldestUntilBounded();

    try {
      return { status: "created", response: structuredClone(await response) };
    } catch (error) {
      this.entries.delete(key);
      throw error;
    }
  }

  private removeExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  private removeOldestUntilBounded(): void {
    while (this.entries.size > MAX_ENTRIES) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (oldestKey === undefined) return;
      this.entries.delete(oldestKey);
    }
  }
}
