import { computed, type Ref } from 'vue'
import { google, yahoo, ics } from 'calendar-link'
import type { CalendarEvent } from 'calendar-link'

interface CalendarLinkOptions {
  title: Ref<string>
  startTs: Ref<number>
  endTs: Ref<number | null>
  description?: Ref<string>
  location?: Ref<string>
  url?: Ref<string>
}

// calendar-link uses local browser time for Outlook/Office365 which is incorrect
// for a timezone-conversion tool. We generate those URLs ourselves using UTC.
function toUtcIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}/, '')
}

// Google/Yahoo/Outlook have no dedicated URL field — prepend it before the description.
function descriptionWithUrl(description?: string, url?: string): string | undefined {
  if (!url) return description || undefined
  return description ? `${url}\n\n${description}` : url
}

function outlookUrl(params: URLSearchParams, base: string): string {
  return `${base}?${params.toString()}`
}

function buildOutlookParams(
  startDate: Date,
  endDate: Date,
  title: string,
  description?: string,
  location?: string,
  url?: string,
): URLSearchParams {
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: toUtcIso(startDate),
    enddt: toUtcIso(endDate),
    subject: title,
    allday: 'false',
  })
  const body = descriptionWithUrl(description, url)
  if (body) p.set('body', body)
  if (location) p.set('location', location)
  return p
}

export function useCalendarLinks(opts: CalendarLinkOptions) {
  const startDate = computed(() => new Date(opts.startTs.value * 1000))

  const timingFields = computed(() =>
    opts.endTs.value !== null
      ? { end: new Date(opts.endTs.value * 1000) }
      : { duration: [1, 'hour'] as [number, 'hour'] },
  )

  // ICS has a native URL property — keep url as a separate field.
  const icsEvent = computed((): CalendarEvent => ({
    title: opts.title.value || 'Event',
    start: startDate.value,
    ...timingFields.value,
    ...(opts.description?.value ? { description: opts.description.value } : {}),
    ...(opts.location?.value ? { location: opts.location.value } : {}),
    ...(opts.url?.value ? { url: opts.url.value } : {}),
  }))

  // Google/Yahoo have no dedicated URL field — append it to description.
  const webEvent = computed((): CalendarEvent => ({
    title: opts.title.value || 'Event',
    start: startDate.value,
    ...timingFields.value,
    ...(descriptionWithUrl(opts.description?.value, opts.url?.value)
      ? { description: descriptionWithUrl(opts.description?.value, opts.url?.value) }
      : {}),
    ...(opts.location?.value ? { location: opts.location.value } : {}),
  }))

  const endDate = computed(() =>
    opts.endTs.value !== null
      ? new Date(opts.endTs.value * 1000)
      : new Date(opts.startTs.value * 1000 + 3600_000),
  )

  const googleUrl = computed(() => google(webEvent.value))
  const yahooUrl = computed(() => yahoo(webEvent.value))

  // ics() returns a data URI — decode it to get the raw ICS string so the
  // component can create a Blob URL, which browsers open in Calendar.app
  // rather than rendering as text.
  const icsContent = computed(() => {
    const dataUri = ics(icsEvent.value)
    return decodeURIComponent(dataUri.replace('data:text/calendar;charset=utf8,', ''))
  })

  const outlookParams = computed(() =>
    buildOutlookParams(
      startDate.value,
      endDate.value,
      opts.title.value || 'Event',
      opts.description?.value,
      opts.location?.value,
      opts.url?.value,
    ),
  )

  const outlookComUrl = computed(() =>
    outlookUrl(outlookParams.value, 'https://outlook.live.com/calendar/0/action/compose'),
  )

  const office365Url = computed(() =>
    outlookUrl(outlookParams.value, 'https://outlook.office.com/calendar/0/action/compose'),
  )

  const icsFilename = computed(() =>
    `${(opts.title.value || 'event').toLowerCase().replace(/\s+/g, '-')}.ics`,
  )

  return { googleUrl, outlookUrl: outlookComUrl, office365Url, yahooUrl, icsContent, icsFilename }
}
