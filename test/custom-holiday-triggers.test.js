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

function recorder(calls, name) {
  return {
    trigger: async (tokens, state) => calls.push({ name, tokens, state }),
  };
}

test("checkHolidayTriggers fires custom start on the first day and ends on the day after the last day", async () => {
  const calls = [];
  const app = Object.create(SchoolHolidayApp.prototype);
  Object.assign(app, {
    homey: {
      clock: { getTimezone: () => "Europe/Amsterdam" },
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
              endDate: "2026-04-28",
            },
          ];
        },
      },
    },
    getVacations: async () => [],
    triggerCustomHolidayStarts: recorder(calls, "start"),
    triggerCustomHolidayEnds: recorder(calls, "end"),
    triggerAnyCustomHolidayStarts: recorder(calls, "anyStart"),
    triggerAnyCustomHolidayEnds: recorder(calls, "anyEnd"),
    error: () => {},
  });

  await app.checkHolidayTriggers("2026-04-29");

  assert.deepEqual(calls, [
    {
      name: "start",
      tokens: { holiday_name: "My Spring Trip" },
      state: { holiday: "101" },
    },
    {
      name: "anyStart",
      tokens: { holiday_name: "My Spring Trip" },
      state: undefined,
    },
    {
      name: "end",
      tokens: { holiday_name: "Kingsday Weekend" },
      state: { holiday: "202" },
    },
    {
      name: "anyEnd",
      tokens: { holiday_name: "Kingsday Weekend" },
      state: undefined,
    },
  ]);
});
