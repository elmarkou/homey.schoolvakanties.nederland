const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

let requestedUrl;

const originalLoad = Module._load;
Module._load = function mockModules(request, parent, isMain) {
  if (request === "homey") {
    return { App: class App {} };
  }

  if (request === "node-fetch") {
    return async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({ content: [] }),
      };
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const SchoolHolidayApp = require("../app");

test("fetchSchoolHolidayData requests JSON output from the school holidays API", async () => {
  requestedUrl = undefined;

  await SchoolHolidayApp.prototype.fetchSchoolHolidayData.call({}, "2025-2026");

  assert.equal(
    requestedUrl,
    "https://opendata.rijksoverheid.nl/v1/infotypes/schoolholidays/schoolyear/2025-2026?output=json",
  );
});