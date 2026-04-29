const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function mockHomey(request, parent, isMain) {
  if (request === "homey") {
    return { App: class App {} };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const SchoolHolidayApp = require("../app");

test("checkHolidayTriggers fires custom holiday start and end cards for today's custom dates", async () => {
  const customStartTriggerCalls = [];
  const customEndTriggerCalls = [];

  const context = {
    cachedHolidayData: [],
    resolveHolidayData: async () => [],
    getCustomDates: SchoolHolidayApp.prototype.getCustomDates,
    homey: {
      settings: {
        get: (key) => {
          assert.equal(key, "customDates");
          return [
            {
              id: 101,
              label: "My Spring Trip",
              startDate: "2026-04-29",
              endDate: "2026-05-02",
            },
            {
              id: 202,
              label: "Kingsday Weekend",
              startDate: "2026-04-26",
              endDate: "2026-04-29",
            },
          ];
        },
      },
    },
    triggerHolidayStarts: { trigger: async () => {} },
    triggerHolidayEnds: { trigger: async () => {} },
    triggerAnyHolidayStarts: { trigger: async () => {} },
    triggerAnyHolidayEnds: { trigger: async () => {} },
    triggerCustomHolidayStarts: {
      trigger: async (tokens, state) => {
        customStartTriggerCalls.push({ tokens, state });
      },
    },
    triggerCustomHolidayEnds: {
      trigger: async (tokens, state) => {
        customEndTriggerCalls.push({ tokens, state });
      },
    },
    error: () => {},
    log: () => {},
  };

  await SchoolHolidayApp.prototype.checkHolidayTriggers.call(context);

  assert.deepEqual(customStartTriggerCalls, [
    {
      tokens: { holiday_name: "My Spring Trip" },
      state: { holiday: "101" },
    },
  ]);
  assert.deepEqual(customEndTriggerCalls, [
    {
      tokens: { holiday_name: "Kingsday Weekend" },
      state: { holiday: "202" },
    },
  ]);
});