import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { useCalendarLinks } from '../useCalendarLinks'

// 2026-05-30T11:37:00Z
const START_TS = 1780141020
// 2026-05-30T12:37:00Z  (1 hour later, same day)
const END_TS = 1780144620
// 2026-05-31T11:37:00Z  (next day)
const END_TS_NEXT_DAY = 1780227420

describe('useCalendarLinks', () => {
  describe('Google Calendar URL', () => {
    it('includes UTC start and end times', () => {
      const { googleUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      expect(googleUrl.value).toContain('20260530T113700Z')
      expect(googleUrl.value).toContain('20260530T123700Z')
    })

    it('uses 1-hour duration when no end time', () => {
      const { googleUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(googleUrl.value).toContain('20260530T113700Z')
      expect(googleUrl.value).toContain('20260530T123700Z')
    })

    it('falls back to "Event" title when title is empty', () => {
      const { googleUrl } = useCalendarLinks({
        title: ref(''),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(googleUrl.value).toContain('Event')
    })

    it('includes url in details when no description', () => {
      const { googleUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        url: ref('https://example.com'),
      })
      expect(googleUrl.value).toContain('example.com')
    })

    it('prepends url before description in details', () => {
      const { googleUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        description: ref('A description'),
        url: ref('https://example.com'),
      })
      const details = new URL(googleUrl.value).searchParams.get('details')!
      expect(details.indexOf('example.com')).toBeLessThan(details.indexOf('A description'))
    })
  })

  describe('Outlook.com URL', () => {
    it('uses UTC ISO format for startdt', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      expect(outlookUrl.value).toContain('startdt=2026-05-30T11%3A37%3A00Z')
    })

    it('uses UTC ISO format for enddt', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      expect(outlookUrl.value).toContain('enddt=2026-05-30T12%3A37%3A00Z')
    })

    it('defaults end to 1 hour after start when no end time', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(outlookUrl.value).toContain('startdt=2026-05-30T11%3A37%3A00Z')
      expect(outlookUrl.value).toContain('enddt=2026-05-30T12%3A37%3A00Z')
    })

    it('includes description and location when provided', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
        description: ref('A description'),
        location: ref('Amsterdam'),
      })
      expect(outlookUrl.value).toContain('body=A+description')
      expect(outlookUrl.value).toContain('location=Amsterdam')
    })

    it('includes url in body when no description', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        url: ref('https://example.com'),
      })
      expect(outlookUrl.value).toContain('example.com')
    })

    it('prepends url before description in body', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        description: ref('A description'),
        url: ref('https://example.com'),
      })
      const body = new URL(outlookUrl.value).searchParams.get('body')!
      expect(body.indexOf('example.com')).toBeLessThan(body.indexOf('A description'))
    })

    it('points to outlook.live.com', () => {
      const { outlookUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(outlookUrl.value).toMatch(/^https:\/\/outlook\.live\.com\//)
    })
  })

  describe('Office 365 URL', () => {
    it('points to outlook.office.com', () => {
      const { office365Url } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(office365Url.value).toMatch(/^https:\/\/outlook\.office\.com\//)
    })

    it('uses UTC times (not local browser time)', () => {
      const { office365Url } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      // Must end with Z suffix — confirms UTC, not local time
      expect(office365Url.value).toContain('startdt=2026-05-30T11%3A37%3A00Z')
      expect(office365Url.value).toContain('enddt=2026-05-30T12%3A37%3A00Z')
    })
  })

  describe('Yahoo Calendar URL', () => {
    it('includes url in desc when no description', () => {
      const { yahooUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        url: ref('https://example.com'),
      })
      expect(yahooUrl.value).toContain('example.com')
    })

    it('prepends url before description in desc', () => {
      const { yahooUrl } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        description: ref('A description'),
        url: ref('https://example.com'),
      })
      const desc = new URL(yahooUrl.value).searchParams.get('desc')!
      expect(desc.indexOf('example.com')).toBeLessThan(desc.indexOf('A description'))
    })
  })

  describe('ICS content', () => {
    it('contains VCALENDAR wrapper', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      expect(icsContent.value).toContain('BEGIN:VCALENDAR')
      expect(icsContent.value).toContain('END:VCALENDAR')
    })

    it('contains UTC DTSTART with Z suffix', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      expect(icsContent.value).toContain('DTSTART:20260530T113700Z')
    })

    it('contains UTC DTEND with Z suffix', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS),
      })
      expect(icsContent.value).toContain('DTEND:20260530T123700Z')
    })

    it('contains event title as SUMMARY', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('My Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(icsContent.value).toContain('SUMMARY:My Event')
    })

    it('includes URL property when url is provided', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        url: ref('https://example.com'),
      })
      expect(icsContent.value).toContain('URL:https://example.com')
    })

    it('does not duplicate url in DESCRIPTION when both are provided', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('Test Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
        description: ref('A description'),
        url: ref('https://example.com'),
      })
      expect(icsContent.value).toContain('URL:https://example.com')
      expect(icsContent.value).toContain('DESCRIPTION:A description')
      // url should appear exactly once (in URL: property, not also in DESCRIPTION)
      expect(icsContent.value.split('example.com').length - 1).toBe(1)
    })

    it('works across midnight (next-day end time)', () => {
      const { icsContent } = useCalendarLinks({
        title: ref('Late Event'),
        startTs: ref(START_TS),
        endTs: ref(END_TS_NEXT_DAY),
      })
      expect(icsContent.value).toContain('DTSTART:20260530T113700Z')
      expect(icsContent.value).toContain('DTEND:20260531T113700Z')
    })
  })

  describe('ICS filename', () => {
    it('lowercases and slugifies the title', () => {
      const { icsFilename } = useCalendarLinks({
        title: ref('My Cool Event'),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(icsFilename.value).toBe('my-cool-event.ics')
    })

    it('falls back to "event.ics" when title is empty', () => {
      const { icsFilename } = useCalendarLinks({
        title: ref(''),
        startTs: ref(START_TS),
        endTs: ref(null),
      })
      expect(icsFilename.value).toBe('event.ics')
    })
  })
})
