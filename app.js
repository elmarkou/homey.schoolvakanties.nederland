"use strict";

const Homey = require("homey");
const fetch = require("node-fetch");
const moment = require("moment");

const SUPPORTED_LANGUAGES = ["nl", "en", "de", "fr"];
const CUSTOM_DATES_KEY = "customDates";
const TOKEN_REGION_KEY = "tokenRegion";
const LAST_TRIGGER_DAY_KEY = "lastTriggerDay";
const DATE_PRETTY_FORMAT = "LL";
const REGIONS = ["noord", "midden", "zuid"];
// The API publishes Dutch calendar days as UTC timestamps.
const API_TIMEZONE = "Europe/Amsterdam";
const API_ENDPOINT =
  "https://opendata.rijksoverheid.nl/v1/infotypes/schoolholidays/schoolyear/";
const FETCH_TIMEOUT_MS = 15 * 1000;
// ponytail: polls the local date every minute, so day-change work runs within a minute after midnight
// and survives DST and timer drift. Switch to a computed timeout if minute precision ever matters.
const TICK_MS = 60 * 1000;
const DAY_OFFSET = { yesterday: -1, today: 0, tomorrow: 1 };

// Calendar day ("YYYY-MM-DD") of a Date in the given timezone.
function toDay(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addDays(day, amount) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

function isInRanges(day, ranges) {
  return ranges.some(
    ({ startDate, endDate }) => startDate <= day && day <= endDate,
  );
}

// Normalize one school year from the API to
// [{ id, label, regions: { noord: { startDate, endDate }, ... } }].
function normalizeVacations(schoolYear) {
  return (schoolYear.vacations || []).map((vacation) => {
    const label = vacation.type.trim();
    const regions = {};
    for (const { region, startdate, enddate } of vacation.regions) {
      const range = {
        startDate: toDay(new Date(startdate), API_TIMEZONE),
        endDate: toDay(new Date(enddate), API_TIMEZONE),
      };
      const targets = region === "heel Nederland" ? REGIONS : [region];
      for (const target of targets) regions[target] = range;
    }
    return { id: label.toLowerCase(), label, regions };
  });
}

class SchoolHolidayApp extends Homey.App {
  async onInit() {
    const language = this.homey.i18n.getLanguage();
    moment.locale(SUPPORTED_LANGUAGES.includes(language) ? language : "en");

    this.holidayCache = null; // { day, years: [{ raw, vacations }] }
    this.holidayRequest = null;

    this.tokenYesterday = await this.createToken(
      "SchoolHolidayYesterday",
      "tokens.yesterday",
      "boolean",
    );
    this.tokenToday = await this.createToken(
      "SchoolHolidayToday",
      "tokens.today",
      "boolean",
    );
    this.tokenTomorrow = await this.createToken(
      "SchoolHolidayTomorrow",
      "tokens.tomorrow",
      "boolean",
    );
    this.tokenNextName = await this.createToken(
      "SchoolHolidayNextName",
      "tokens.next_name",
      "string",
    );
    this.tokenDaysUntil = await this.createToken(
      "SchoolHolidayDaysUntil",
      "tokens.days_until",
      "number",
    );
    this.tokenDaysRemaining = await this.createToken(
      "SchoolHolidayDaysRemaining",
      "tokens.days_remaining",
      "number",
    );

    this.registerWidgets();
    this.registerFlowCards();

    // First start of this version: start counting from today instead of firing triggers mid-day.
    if (!this.homey.settings.get(LAST_TRIGGER_DAY_KEY)) {
      this.homey.settings.set(LAST_TRIGGER_DAY_KEY, this.today());
    }
    this.homey.settings.on("set", (key) => {
      if (key === TOKEN_REGION_KEY) this.refreshTokens().catch(this.error);
    });
    this.refreshTokens().catch(this.error);
    this.tickInterval = this.homey.setInterval(() => this.onTick(), TICK_MS);
    this.log("School Holidays Netherlands initialized");
  }

  async onUninit() {
    if (this.tickInterval) this.homey.clearInterval(this.tickInterval);
  }

  createToken(id, titleKey, type) {
    return this.homey.flow.createToken(id, {
      type,
      title: this.homey.__(titleKey),
    });
  }

  today() {
    return toDay(new Date(), this.homey.clock.getTimezone());
  }

  // Custom dates are "YYYY-MM-DD"; flow arguments from older versions hold ISO timestamps.
  toLocalDay(value) {
    const text = String(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? text
      : toDay(new Date(text), this.homey.clock.getTimezone());
  }

  customRange({ startDate, endDate }) {
    return {
      startDate: this.toLocalDay(startDate),
      endDate: this.toLocalDay(endDate),
    };
  }

  // Runs day-change work once per local day, also across app restarts.
  async onTick() {
    const today = this.today();
    if (this.ticking || this.homey.settings.get(LAST_TRIGGER_DAY_KEY) === today)
      return;
    this.ticking = true;
    try {
      this.homey.settings.set(LAST_TRIGGER_DAY_KEY, today);
      await this.checkHolidayTriggers(today);
      await this.refreshTokens();
    } catch (error) {
      this.error("Day change failed:", error);
    } finally {
      this.ticking = false;
    }
  }

  // Flow cards

  registerFlowCards() {
    const conditions = {
      is_school_holiday: this.handleSchoolHolidayCondition,
      is_specific_school_holiday: this.handleSpecificSchoolHolidayCondition,
      is_school_holiday_in_days: this.handleSchoolHolidayInDaysCondition,
      is_custom_holiday: this.handleCustomHolidayCondition,
      is_any_custom_holiday: this.handleAnyCustomHolidayCondition,
    };
    for (const [id, handler] of Object.entries(conditions)) {
      this.homey.flow
        .getConditionCard(id)
        .registerRunListener(handler.bind(this));
    }
    this.homey.flow
      .getConditionCard("is_custom_holiday")
      .registerArgumentAutocompleteListener(
        "holiday",
        this.autocompleteHolidays.bind(this),
      );

    const regionMatches = async (args, state) => args.regio === state.regio;
    const holidayMatches = async (args, state) =>
      args.holiday === state.holiday && args.regio === state.regio;
    const customMatches = async (args, state) =>
      String(args.holiday?.id) === String(state.holiday);

    this.triggerHolidayStarts = this.homey.flow.getTriggerCard(
      "specific_holiday_starts",
    );
    this.triggerHolidayStarts.registerRunListener(holidayMatches);
    this.triggerHolidayEnds = this.homey.flow.getTriggerCard(
      "specific_holiday_ends",
    );
    this.triggerHolidayEnds.registerRunListener(holidayMatches);
    this.triggerAnyHolidayStarts =
      this.homey.flow.getTriggerCard("holiday_starts");
    this.triggerAnyHolidayStarts.registerRunListener(regionMatches);
    this.triggerAnyHolidayEnds = this.homey.flow.getTriggerCard("holiday_ends");
    this.triggerAnyHolidayEnds.registerRunListener(regionMatches);

    this.triggerCustomHolidayStarts = this.homey.flow.getTriggerCard(
      "custom_holiday_starts",
    );
    this.triggerCustomHolidayEnds = this.homey.flow.getTriggerCard(
      "custom_holiday_ends",
    );
    for (const card of [
      this.triggerCustomHolidayStarts,
      this.triggerCustomHolidayEnds,
    ]) {
      card.registerRunListener(customMatches);
      card.registerArgumentAutocompleteListener(
        "holiday",
        this.autocompleteHolidays.bind(this),
      );
    }
    this.triggerAnyCustomHolidayStarts = this.homey.flow.getTriggerCard(
      "any_custom_holiday_starts",
    );
    this.triggerAnyCustomHolidayEnds = this.homey.flow.getTriggerCard(
      "any_custom_holiday_ends",
    );
  }

  async checkHolidayTriggers(today) {
    // "Ends" fires on the first day after the holiday, e.g. on 27 Dec when the last day is 26 Dec.
    const yesterday = addDays(today, -1);

    // Custom holidays first, so they still fire when the school holiday API is down.
    for (const holiday of this.getCustomDates()) {
      const { startDate, endDate } = this.customRange(holiday);
      const tokens = { holiday_name: holiday.label?.trim() || "" };
      const state = { holiday: String(holiday.id) };
      if (startDate === today) {
        await this.triggerCustomHolidayStarts
          .trigger(tokens, state)
          .catch(this.error);
        await this.triggerAnyCustomHolidayStarts
          .trigger(tokens)
          .catch(this.error);
      }
      if (endDate === yesterday) {
        await this.triggerCustomHolidayEnds
          .trigger(tokens, state)
          .catch(this.error);
        await this.triggerAnyCustomHolidayEnds
          .trigger(tokens)
          .catch(this.error);
      }
    }

    for (const vacation of await this.getVacations()) {
      const tokens = { holiday_name: vacation.label };
      for (const regio of REGIONS) {
        const range = vacation.regions[regio];
        if (!range) continue;
        if (range.startDate === today) {
          await this.triggerHolidayStarts
            .trigger(tokens, { holiday: vacation.id, regio })
            .catch(this.error);
          await this.triggerAnyHolidayStarts
            .trigger(tokens, { regio })
            .catch(this.error);
        }
        if (range.endDate === yesterday) {
          await this.triggerHolidayEnds
            .trigger(tokens, { holiday: vacation.id, regio })
            .catch(this.error);
          await this.triggerAnyHolidayEnds
            .trigger(tokens, { regio })
            .catch(this.error);
        }
      }
    }
  }

  resolveDay(day) {
    return addDays(this.today(), DAY_OFFSET[day] ?? 0);
  }

  async schoolRanges(region, holidayId) {
    return (await this.getVacations())
      .filter((vacation) => !holidayId || vacation.id === holidayId)
      .map((vacation) => vacation.regions[region])
      .filter(Boolean);
  }

  // Existing users get tokens for the region they check, until they pick one in the settings.
  seedTokenRegion(regio) {
    if (this.homey.settings.get(TOKEN_REGION_KEY)) return;
    this.homey.settings.set(TOKEN_REGION_KEY, regio);
    this.refreshTokens().catch(this.error);
  }

  async handleSchoolHolidayCondition({ day, regio }) {
    this.seedTokenRegion(regio);
    return isInRanges(this.resolveDay(day), await this.schoolRanges(regio));
  }

  async handleSpecificSchoolHolidayCondition({ regio, holiday, day }) {
    this.seedTokenRegion(regio);
    return isInRanges(
      this.resolveDay(day),
      await this.schoolRanges(regio, holiday.toLowerCase()),
    );
  }

  async handleSchoolHolidayInDaysCondition({ days, regio }) {
    const target = addDays(this.today(), Math.round(days));
    const ranges = await this.schoolRanges(regio);
    const lastKnownDay = ranges.reduce(
      (last, { endDate }) => (endDate > last ? endDate : last),
      "",
    );
    if (target > lastKnownDay) {
      throw new Error(`No school holiday data published yet for ${target}`);
    }
    return isInRanges(target, ranges);
  }

  async handleCustomHolidayCondition({ day, holiday }) {
    // Use the current dates from the settings so edits apply to existing flows.
    const current = this.getCustomDates().find(
      (item) => String(item.id) === String(holiday?.id),
    );
    return isInRanges(this.resolveDay(day), [
      this.customRange(current || holiday),
    ]);
  }

  async handleAnyCustomHolidayCondition({ day }) {
    const ranges = this.getCustomDates().map((holiday) =>
      this.customRange(holiday),
    );
    return isInRanges(this.resolveDay(day), ranges);
  }

  // Global tokens, for the region chosen in the settings.

  async refreshTokens() {
    const region = this.homey.settings.get(TOKEN_REGION_KEY);
    if (!region) return;

    const today = this.today();
    const ranges = await this.schoolRanges(region);
    const [next] = await this.getUpcomingHolidays({
      region,
      count: 1,
      includeCustom: false,
    });
    const isActive = Boolean(next?.isActive);

    await Promise.all([
      this.tokenYesterday.setValue(isInRanges(addDays(today, -1), ranges)),
      this.tokenToday.setValue(isInRanges(today, ranges)),
      this.tokenTomorrow.setValue(isInRanges(addDays(today, 1), ranges)),
      this.tokenNextName.setValue(next ? next.label : ""),
      this.tokenDaysUntil.setValue(
        next && !isActive ? daysBetween(today, next.startDate) : 0,
      ),
      // Including today: 1 on the last holiday day.
      this.tokenDaysRemaining.setValue(
        isActive ? daysBetween(today, next.endDate) + 1 : 0,
      ),
    ]);
  }

  // Holiday data

  getCustomDates() {
    return this.homey.settings.get(CUSTOM_DATES_KEY) || [];
  }

  // Both the previous/current and current/next school year stay loaded, so holidays that
  // cross the school year boundary (summer) keep working. Refreshed once per local day;
  // when the API fails the last good data is used.
  async getHolidayYears() {
    const today = this.today();
    if (this.holidayCache?.day === today) return this.holidayCache.years;

    // ponytail: no backoff while the API is down, each call retries. Add one if the API ever rate limits.
    this.holidayRequest ??= this.fetchHolidayYears(today).finally(() => {
      this.holidayRequest = null;
    });
    try {
      const years = await this.holidayRequest;
      this.holidayCache = { day: today, years };
      return years;
    } catch (error) {
      if (!this.holidayCache) throw error;
      this.error(
        "Fetching school holidays failed, using cached data:",
        error.message,
      );
      return this.holidayCache.years;
    }
  }

  async fetchHolidayYears(today) {
    const year = Number(today.slice(0, 4));
    const schoolyears = [`${year - 1}-${year}`, `${year}-${year + 1}`];
    const results = await Promise.allSettled(
      schoolyears.map((s) => this.fetchSchoolHolidayData(s)),
    );

    // A year that fails to load keeps its previous copy, so one timeout does not drop it for a day.
    const previous = this.holidayCache?.years || [];
    const years = [];
    results.forEach((result, index) => {
      const schoolyear = schoolyears[index];
      const raw =
        result.status === "fulfilled" ? result.value?.content?.[0] : null;
      if (raw) {
        years.push({ schoolyear, raw, vacations: normalizeVacations(raw) });
        return;
      }
      if (result.status === "rejected") this.error(result.reason?.message);
      const cached = previous.find((year) => year.schoolyear === schoolyear);
      if (cached) years.push(cached);
    });
    if (!years.length) throw new Error("No school holiday data available");
    return years;
  }

  async fetchSchoolHolidayData(schoolyear) {
    const response = await fetch(`${API_ENDPOINT}${schoolyear}?output=json`, {
      timeout: FETCH_TIMEOUT_MS,
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch school holidays for ${schoolyear}: HTTP ${response.status}`,
      );
    }
    return response.json();
  }

  async getVacations() {
    return (await this.getHolidayYears()).flatMap(({ vacations }) => vacations);
  }

  // Raw API data of the running school year (or the next one after the summer), for the settings page.
  async fetchHolidays() {
    const today = this.today();
    const years = await this.getHolidayYears();
    const running = years.find(({ vacations }) =>
      vacations.some(({ regions }) =>
        Object.values(regions).some(({ endDate }) => endDate >= today),
      ),
    );
    return (running || years[years.length - 1]).raw;
  }

  async getUpcomingHolidays({ region, count = 3, includeCustom = true }) {
    const today = this.today();
    const school = (await this.getVacations())
      .filter(({ regions }) => regions[region])
      .map(({ label, regions }) => ({
        label,
        ...regions[region],
        isSchoolHoliday: true,
      }));
    const custom = includeCustom
      ? this.getCustomDates().map((holiday) => ({
          ...holiday,
          ...this.customRange(holiday),
          isSchoolHoliday: false,
        }))
      : [];

    return [...school, ...custom]
      .filter(({ endDate }) => endDate >= today)
      .map((holiday) => ({
        ...holiday,
        isActive: holiday.startDate <= today && today <= holiday.endDate,
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, count);
  }

  // Widget and autocomplete

  registerWidgets() {
    const widget = this.homey.dashboards.getWidget("upcoming-holiday");
    widget.registerSettingAutocompleteListener(
      "holiday",
      async (query, settings) => {
        const holidays = await this.getUpcomingHolidays({
          region: settings.regio,
          count: 12,
        });
        return this.toAutocompleteItems(holidays, query);
      },
    );
  }

  async autocompleteHolidays(query) {
    return this.toAutocompleteItems(this.getCustomDates(), query);
  }

  toAutocompleteItems(holidays, query) {
    const format = (day) =>
      moment(this.toLocalDay(day)).format(DATE_PRETTY_FORMAT);
    return holidays
      .filter(({ label }) => label.toLowerCase().includes(query.toLowerCase()))
      .map(({ id, label, isSchoolHoliday, startDate, endDate }) => ({
        name: label,
        description: `${format(startDate)} - ${format(endDate)}`,
        id,
        isSchoolHoliday: Boolean(isSchoolHoliday),
        startDate: this.toLocalDay(startDate),
        endDate: this.toLocalDay(endDate),
      }));
  }

  async getHolidayById(params) {
    return (
      this.getCustomDates().find(
        (item) => String(item.id) === String(params?.id),
      ) || null
    );
  }

  async saveHoliday(id, data) {
    this.homey.api.realtime("updateHolidayEvent", data);
  }

  async removeHoliday(id) {
    this.homey.api.realtime("removeHolidayEvent", id);
  }
}

SchoolHolidayApp.helpers = {
  toDay,
  addDays,
  daysBetween,
  isInRanges,
  normalizeVacations,
};

module.exports = SchoolHolidayApp;
