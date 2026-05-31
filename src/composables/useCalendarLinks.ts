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

function outlookUrl(params: URLSearchParams, base: string): string {
  return `${base}?${params.toString()}`
}

function buildOutlookParams(
  startDate: Date,
  endDate: Date,
  title: string,
  description?: string,
  location?: string,
): URLSearchParams {
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: toUtcIso(startDate),
    enddt: toUtcIso(endDate),
    subject: title,
    allday: 'false',
  })
  if (description) p.set('body', description)
  if (location) p.set('location', location)
  return p
}

export function useCalendarLinks(opts: CalendarLinkOptions) {
  const startDate = computed(() => new Date(opts.startTs.value * 1000))

  const event = computed((): CalendarEvent => ({
    title: opts.title.value || 'Event',
    start: startDate.value,
    ...(opts.endTs.value !== null
      ? { end: new Date(opts.endTs.value * 1000) }
      : { duration: [1, 'hour'] as [number, 'hour'] }),
    ...(opts.description?.value ? { description: opts.description.value } : {}),
    ...(opts.location?.value ? { location: opts.location.value } : {}),
    ...(opts.url?.value ? { url: opts.url.value } : {}),
  }))

  const endDate = computed(() =>
    opts.endTs.value !== null
      ? new Date(opts.endTs.value * 1000)
      : new Date(opts.startTs.value * 1000 + 3600_000),
  )

  const googleUrl = computed(() => google(event.value))
  const yahooUrl = computed(() => yahoo(event.value))

  // ics() returns a data URI — decode it to get the raw ICS string so the
  // component can create a Blob URL, which browsers open in Calendar.app
  // rather than rendering as text.
  const icsContent = computed(() => {
    const dataUri = ics(event.value)
    return decodeURIComponent(dataUri.replace('data:text/calendar;charset=utf8,', ''))
  })

  const outlookParams = computed(() =>
    buildOutlookParams(
      startDate.value,
      endDate.value,
      opts.title.value || 'Event',
      opts.description?.value,
      opts.location?.value,
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
