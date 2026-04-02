import React, { useEffect, useMemo, useState } from 'react'
import { defineMessages, useIntl } from 'react-intl'
import { useCssHandles } from 'vtex.css-handles'

const CSS_HANDLES = ['container', 'timeUnit', 'separator'] as const

/**
 * Prefix for handle class names when the storefront runtime does not expose
 * extension metadata (`useCssHandles` would otherwise yield empty classes).
 * Keep in sync with manifest: `vendor.name@MAJOR` → `{vendor}-{name}-{MAJOR}-x`
 * (example: sunhouse.cron-app@0.0.1 → sunhouse-cron-app-0-x).
 */
const CSS_HANDLES_APP_NS = 'sunhouse-cron-app-0-x'

const messages = defineMessages({
  invalidFormat: {
    id: 'store/countdown.invalidFormat',
    defaultMessage: 'Formato invalido. Use DD/MM/AAAA e HH:mm:ss.',
  },
})

type Props = {
  targetDate?: string
  targetTime?: string
  separator?: string
  timezone?: string
  /** Optional overrides from parent blocks using `useCustomClasses`. */
  classes?: Record<string, unknown>
}

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const ONE_SECOND = 1000
const ZERO_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function readWallTimeInZone(utcMs: number, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date(utcMs))
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? Number.NaN)

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  }
}

function wallTimeInTimezoneToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date | null {
  try {
    let t = Date.UTC(year, month - 1, day, hour, minute, second)

    for (let i = 0; i < 100; i++) {
      const wall = readWallTimeInZone(t, timeZone)

      if (
        wall.year === year &&
        wall.month === month &&
        wall.day === day &&
        wall.hour === hour &&
        wall.minute === minute &&
        wall.second === second
      ) {
        return new Date(t)
      }

      const asUtcTarget = Date.UTC(year, month - 1, day, hour, minute, second)
      const asUtcGot = Date.UTC(
        wall.year,
        wall.month - 1,
        wall.day,
        wall.hour,
        wall.minute,
        wall.second
      )

      t += asUtcTarget - asUtcGot
    }
  } catch {
    return null
  }

  return null
}

function parseTargetDateTime(
  targetDate?: string,
  targetTime?: string,
  timezone?: string
) {
  if (
    typeof targetDate !== 'string' ||
    typeof targetTime !== 'string' ||
    typeof timezone !== 'string'
  ) {
    return null
  }

  const [day, month, year] = targetDate.split('/').map(Number)
  const [hours, minutes, seconds] = targetTime.split(':').map(Number)

  const hasInvalidField = [day, month, year, hours, minutes, seconds].some(
    Number.isNaN
  )

  if (hasInvalidField) {
    return null
  }

  const target = wallTimeInTimezoneToUtc(
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    timezone
  )

  if (!target || Number.isNaN(target.getTime())) {
    return null
  }

  return target
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  const totalSeconds = Math.floor(diff / ONE_SECOND)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function resolveCssHandles(
  runtimeHandles: Record<string, string | undefined>
): { [K in (typeof CSS_HANDLES)[number]]: string } {
  const out = {} as { [K in (typeof CSS_HANDLES)[number]]: string }

  for (const name of CSS_HANDLES) {
    const value = runtimeHandles[name]
    out[name] =
      typeof value === 'string' && value.length > 0
        ? value
        : `${CSS_HANDLES_APP_NS}-${name}`
  }

  return out
}

function Countdown({
  targetDate = '04/04/2026',
  targetTime = '16:45:33',
  separator = ' : ',
  timezone = 'America/Sao_Paulo',
  classes,
}: Props) {
  const intl = useIntl()
  const cssHandlesBag = useCssHandles(CSS_HANDLES, { classes })
  const runtimeHandles = useMemo((): Record<string, string | undefined> => {
    if (
      cssHandlesBag &&
      typeof cssHandlesBag === 'object' &&
      'handles' in cssHandlesBag &&
      cssHandlesBag.handles
    ) {
      return cssHandlesBag.handles as Record<string, string | undefined>
    }
    return cssHandlesBag as unknown as Record<string, string | undefined>
  }, [cssHandlesBag])

  const handles = useMemo(
    () => resolveCssHandles(runtimeHandles),
    [runtimeHandles]
  )

  const target = useMemo(
    () => parseTargetDateTime(targetDate, targetTime, timezone),
    [targetDate, targetTime, timezone]
  )

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    target ? getTimeLeft(target) : ZERO_TIME
  )

  useEffect(() => {
    if (!target) {
      setTimeLeft(ZERO_TIME)
      return undefined
    }

    setTimeLeft(getTimeLeft(target))

    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(target))
    }, ONE_SECOND)

    return () => {
      clearInterval(timer)
    }
  }, [target])

  if (!target) {
    return (
      <span className={handles.container}>
        {intl.formatMessage(messages.invalidFormat)}
      </span>
    )
  }

  return (
    <span className={handles.container}>
      <span className={handles.timeUnit}>{`${pad2(timeLeft.days)}d`}</span>
      <span className={handles.separator}>{separator}</span>
      <span className={handles.timeUnit}>{`${pad2(timeLeft.hours)}h`}</span>
      <span className={handles.separator}>{separator}</span>
      <span className={handles.timeUnit}>{`${pad2(timeLeft.minutes)}m`}</span>
      <span className={handles.separator}>{separator}</span>
      <span className={handles.timeUnit}>{`${pad2(timeLeft.seconds)}s`}</span>
    </span>
  )
}

Countdown.schema = {
  title: 'Cronometro por data',
  description: 'Contador regressivo com data e hora futuras',
  type: 'object',
  properties: {
    targetDate: {
      title: 'Data alvo',
      description: 'Formato DD/MM/AAAA. Ex: 04/04/2026',
      type: 'string',
      default: '04/04/2026',
    },
    targetTime: {
      title: 'Hora alvo',
      description: 'Formato HH:mm:ss. Ex: 16:45:33',
      type: 'string',
      default: '16:45:33',
    },
    separator: {
      title: 'Separador',
      description: 'Caractere(s) entre as unidades. Ex: " : " ou " | "',
      type: 'string',
      default: ' : ',
    },
    timezone: {
      title: 'Fuso horário',
      description: 'Ex: America/Sao_Paulo, America/New_York, Europe/Lisbon',
      type: 'string',
      default: 'America/Sao_Paulo',
    },
  },
}

export default Countdown
