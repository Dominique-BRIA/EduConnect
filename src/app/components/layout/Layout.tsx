import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Home,
  LogOut,
  MessageCircle,
  Radio,
  UserRound,
} from 'lucide-react'

import { notifApi } from '@/api'
import { useAuth } from '@/hooks/useAuth'
import { fullName, getInitials } from '@/lib/formatters'

import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'

const navigation = [
  { to: '/', label: "Fil d'actualité", icon: Home },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/lives', label: 'Lives', icon: Radio },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data } = await notifApi.count()
        setNotifCount(data.count)
      } catch (error) {
        console.error('Impossible de charger le compteur de notifications', error)
      }
    }

    void loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    window.addEventListener('focus', loadNotifications)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', loadNotifications)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const profileHref = useMemo(() => `/profil/${user?.id ?? ''}`, [user?.id])

  const initials = user ? getInitials(user.nom, user.prenom) : '?'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_50px_-24px_rgba(16,115,105,0.75)]">
              <span className="text-lg font-semibold">E</span>
            </div>
            <div>
              <p className="font-[family:var(--font-display)] text-[1.35rem] leading-none text-foreground">
                EduConnect
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Collaboration et veille campus
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-card/80 hover:text-foreground',
                  ].join(' ')
                }
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {to === '/notifications' && notifCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 min-w-5 justify-center rounded-full px-1.5 py-0 text-[10px]"
                  >
                    {notifCount > 9 ? '9+' : notifCount}
                  </Badge>
                )}
              </NavLink>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-auto gap-3 rounded-full border-border bg-card/80 px-3 py-2 shadow-sm"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="hidden min-w-0 flex-1 text-left sm:block">
                  <p className="truncate text-sm font-medium text-foreground">
                    {fullName(user?.nom, user?.prenom)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.etablissement || 'Compte étudiant'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/70">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(profileHref)}>
                <UserRound className="mr-2 size-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 size-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 pb-24 pt-6 lg:px-6">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-[92px] space-y-4">
            <div className="rounded-[1.75rem] border border-border/80 bg-sidebar/95 p-5 shadow-[0_20px_60px_-40px_rgba(27,31,36,0.35)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Navigation
              </p>
              <nav className="mt-4 space-y-2">
                {navigation.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      [
                        'flex items-center justify-between rounded-2xl px-4 py-3 transition',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_-28px_rgba(16,115,105,0.8)]'
                          : 'text-foreground/78 hover:bg-sidebar-accent hover:text-foreground',
                      ].join(' ')
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </span>
                    {to === '/notifications' && notifCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="min-w-5 justify-center rounded-full px-1.5 py-0 text-[10px]"
                      >
                        {notifCount > 9 ? '9+' : notifCount}
                      </Badge>
                    )}
                  </NavLink>
                ))}
                <NavLink
                  to={profileHref}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-2xl px-4 py-3 transition',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_-28px_rgba(16,115,105,0.8)]'
                        : 'text-foreground/78 hover:bg-sidebar-accent hover:text-foreground',
                    ].join(' ')
                  }
                >
                  <UserRound className="size-4" />
                  <span className="text-sm font-medium">Mon profil</span>
                </NavLink>
              </nav>
            </div>

            <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {fullName(user?.nom, user?.prenom)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.etablissement || 'Espace personnel'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-muted/70 px-3 py-3">
                  <p className="text-lg font-semibold text-foreground">{user?.nbAbonnements ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Abonnements
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/70 px-3 py-3">
                  <p className="text-lg font-semibold text-foreground">{user?.nbAbonnes ?? 0}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Abonnés
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[1.6rem] border border-border/80 bg-card/95 p-2 shadow-[0_20px_60px_-40px_rgba(27,31,36,0.4)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[...navigation, { to: profileHref, label: 'Profil', icon: UserRound }].map(
            ({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                  ].join(' ')
                }
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {to === '/notifications' && notifCount > 0 && (
                  <span className="absolute right-3 top-2 size-2 rounded-full bg-destructive" />
                )}
              </NavLink>
            ),
          )}
        </div>
      </nav>
    </div>
  )
}
