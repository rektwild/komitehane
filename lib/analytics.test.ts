import assert from "node:assert/strict";
import test from "node:test";

// gaConfig is read at import time, so enable GA before loading the module.
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
Object.assign(process.env, {NODE_ENV: "production"});
const {trackEvent} = await import("./analytics.ts");

const event = {
  name: "tool_calculate",
  params: {
    tool_key: "committeeGrade",
    result_status: "calculated",
    grading_mode: "manual",
    assessment_count: 3,
  },
} as const;

test("is a no-op outside the browser", () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.doesNotThrow(() => trackEvent(event));
});

test("queues a gtag Arguments entry on the data layer", () => {
  const fakeWindow: {dataLayer?: unknown[]} = {};
  Object.assign(globalThis, {window: fakeWindow});

  try {
    trackEvent(event);

    assert.equal(fakeWindow.dataLayer?.length, 1);
    const [entry] = fakeWindow.dataLayer ?? [];
    // gtag.js ignores plain arrays; it must be an Arguments object.
    assert.equal(Object.prototype.toString.call(entry), "[object Arguments]");
    assert.deepEqual(Array.from(entry as ArrayLike<unknown>), [
      "event",
      "tool_calculate",
      event.params,
    ]);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
