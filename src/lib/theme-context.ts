export interface ThemeState {
  sidebarColor: string
  sidebarTextColor: string
  accentColor: string
  logoUrl: string
  divisionName: string
  dashboardBgUrl?: string
  welcomeEnabled?: boolean
  welcomeBanner?: string
}

const DEFAULT_THEME: ThemeState = {
  sidebarColor: '#101820',
  sidebarTextColor: '#FFFFFF',
  accentColor: '#00C4FF',
  logoUrl: 'https://i.imgur.com/EAimMhx.png',
  divisionName: 'Federal Investigation Bureau',
  dashboardBgUrl: '',
  welcomeEnabled: false,
  welcomeBanner: '',
}

export function useTheme() {
  return {
    theme: DEFAULT_THEME,
    setTheme: (_: Partial<ThemeState>) => {
      // no-op in this simplified implementation
    },
  }
}
