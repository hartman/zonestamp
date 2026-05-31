const repoUrl = 'https://github.com/hartman/zonestamp'
const mapSearchBaseUrl = 'https://duckduckgo.com/'

export const appConfig = {
  repoUrl,
  issueUrl: `${repoUrl}/issues/new`,
  licenseUrl: `${repoUrl}/blob/main/LICENSE`,
  mapSearchBaseUrl,
  mapSearchUrl: (location: string) => {
    const params = new URLSearchParams({ q: location, iaxm: 'maps' })
    return `${mapSearchBaseUrl}?${params.toString()}`
  },
} as const