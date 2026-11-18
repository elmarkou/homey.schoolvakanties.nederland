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
const { toDay, normalizeVacations } = SchoolHolidayApp.helpers;

// Shape and timestamps as returned by opendata.rijksoverheid.nl
const SCHOOL_YEAR = {
  schoolyear: "2026-2027",
  vacations: [
    {
      type: "\n   Herfstvakantie \n  ",
      regions: [
        {
          region: "noord",
          startdate: "2026-10-10T00:00:00.000Z",
          enddate: "2026-10-18T21:59:00.000Z",
        },
        {
          region: "midden",
          startdate: "2026-10-17T00:00:00.000Z",
          enddate: "2026-10-25T22:59:00.000Z",
        },
        {
          region: "zuid",
          startdate: "2026-10-17T00:00:00.000Z",
          enddate: "2026-10-25T22:59:00.000Z",
        },
      ],
    },
    {
      type: "\n   Kerstvakantie \n  ",
      regions: [
        {
          region: "heel Nederland",
          startdate: "2026-12-19T00:00:00.000Z",
          enddate: "2027-01-03T22:59:00.000Z",
        },
      ],
    },
  ],
};

function createApp({ today, fetchSchoolHolidayData } = {}) {
  const settings = {};
  const calls = [];
  const recorder = (name) => ({
    trigger: async (tokens, state) => calls.push({ name, tokens, state }),
  });
  const app = Object.create(SchoolHolidayApp.prototype);
  Object.assign(app, {
    calls,
    holidayCache: null,
    holidayRequest: null,
    homey: {
      clock: { getTimezone: () => "Europe/Amsterdam" },
      settings: {
        get: (key) => settings[key],
        set: (key, value) => (settings[key] = value),
      },
    },
    fetchSchoolHolidayData:
      fetchSchoolHolidayData ||
      (async (schoolyear) => ({
        content: schoolyear === "2026-2027" ? [SCHOOL_YEAR] : [],
      })),
    triggerHolidayStarts: recorder("start"),
    triggerHolidayEnds: recorder("end"),
    triggerAnyHolidayStarts: recorder("anyStart"),
    triggerAnyHolidayEnds: recorder("anyEnd"),
    error: () => {},
    log: () => {},
  });
  if (today) app.today = () => today;
  return app;
}

test("normalizeVacations maps API timestamps to Dutch calendar days and expands heel Nederland", () => {
  const [herfst, kerst] = normalizeVacations(SCHOOL_YEAR);
  assert.equal(herfst.id, "herfstvakantie");
  assert.deepEqual(herfst.regions.noord, {
    startDate: "2026-10-10",
    endDate: "2026-10-18",
  });
  assert.deepEqual(herfst.regions.zuid, {
    startDate: "2026-10-17",
    endDate: "2026-10-25",
  });
  for (const region of ["noord", "midden", "zuid"]) {
    assert.deepEqual(kerst.regions[region], {
      startDate: "2026-12-19",
      endDate: "2027-01-03",
    });
  }
});

test("today is the local date shortly after midnight", () => {
  // 00:30 in Amsterdam is still the previous day in UTC
  assert.equal(
    toDay(new Date("2026-10-16T22:30:00Z"), "Europe/Amsterdam"),
    "2026-10-17",
  );
});

test("school holiday triggers fire on the start day for the matching regions", async () => {
  const app = createApp({ today: "2026-10-17" });
  await app.checkHolidayTriggers("2026-10-17");
  assert.deepEqual(
    app.calls.map(({ name, state }) => [name, state.regio, state.holiday]),
    [
      ["start", "midden", "herfstvakantie"],
      ["anyStart", "midden", undefined],
      ["start", "zuid", "herfstvakantie"],
      ["anyStart", "zuid", undefined],
    ],
  );
});

test("school holiday ends triggers fire on the first day after the holiday", async () => {
  const app = createApp({ today: "2026-10-19" });
  await app.checkHolidayTriggers("2026-10-19");
  assert.deepEqual(
    app.calls.map(({ name, state }) => [name, state.regio]),
    [
      ["end", "noord"],
      ["anyEnd", "noord"],
    ],
  );

  const christmas = createApp({ today: "2027-01-04" });
  await christmas.checkHolidayTriggers("2027-01-04");
  assert.equal(christmas.calls.filter(({ name }) => name === "end").length, 3);
});

test("holiday data is fetched once per day and the last good data is kept when the API fails", async () => {
  let requests = 0;
  let failing = false;
  const app = createApp({
    today: "2026-11-18",
    fetchSchoolHolidayData: async () => {
      requests++;
      if (failing) throw new Error("API down");
      return { content: [SCHOOL_YEAR] };
    },
  });

  await app.getVacations();
  await app.getVacations();
  await app.getVacations();
  assert.equal(requests, 2); // previous/current and current/next school year

  failing = true;
  app.today = () => "2026-11-19";
  const vacations = await app.getVacations();
  assert.ok(vacations.length > 0);
});

test("is school holiday in X days uses the local date and refuses dates without data", async () => {
  const app = createApp({ today: "2026-12-12" });
  assert.equal(
    await app.handleSchoolHolidayInDaysCondition({ days: 7, regio: "noord" }),
    true,
  );
  assert.equal(
    await app.handleSchoolHolidayInDaysCondition({ days: 6, regio: "noord" }),
    false,
  );
  await assert.rejects(
    app.handleSchoolHolidayInDaysCondition({ days: 365, regio: "noord" }),
  );
});

test("a school year that fails to load keeps its previous copy", async () => {
  let failing = false;
  const app = createApp({
    today: "2026-11-18",
    fetchSchoolHolidayData: async (schoolyear) => {
      if (schoolyear === "2026-2027" && failing) throw new Error("timeout");
      return { content: schoolyear === "2026-2027" ? [SCHOOL_YEAR] : [] };
    },
  });
  await app.getVacations();

  failing = true;
  app.today = () => "2026-11-19";
  const ids = (await app.getVacations()).map(({ id }) => id);
  assert.deepEqual(ids, ["herfstvakantie", "kerstvakantie"]);
});

test("day change work runs once per local day, not on first start and not again after a restart", async () => {
  let runs = 0;
  let today = "2026-10-16";
  const app = createApp();
  app.today = () => today;
  app.checkHolidayTriggers = async () => runs++;
  app.refreshTokens = async () => {};

  // First start of this version marks today without firing.
  if (!app.homey.settings.get("lastTriggerDay"))
    app.homey.settings.set("lastTriggerDay", app.today());
  await app.onTick();
  assert.equal(runs, 0);

  today = "2026-10-17";
  await app.onTick();
  await app.onTick();
  assert.equal(runs, 1);

  // A restart keeps the persisted day, so nothing fires again.
  const restarted = Object.assign(Object.create(SchoolHolidayApp.prototype), {
    homey: app.homey,
    today: () => today,
    checkHolidayTriggers: async () => runs++,
    refreshTokens: async () => {},
    error: () => {},
  });
  await restarted.onTick();
  assert.equal(runs, 1);
});
