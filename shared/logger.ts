import { inspect } from 'node:util'

import { blue, bold, green, magenta, red, yellow } from 'colorette'

type LogLevel = 'error' | 'warn' | 'info' | 'success' | 'debug'

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  success: 2,
  debug: 3,
}

class Logger {
  private level: LogLevel = 'info'

  setLevel(level: LogLevel): void {
    this.level = Object.hasOwn(LOG_LEVELS, level) ? level : 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level]
  }

  private getTimestamp(): string {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  }

  private formatMessage(level: LogLevel, messages: any[]): string {
    // const timestamp = this.getTimestamp()
    const fixer = messages.length > 1 ? ` ${messages.shift()}` : ''
    const prefix = this.getPrefix(level, fixer)
    const formattedMessages = messages.map(msg =>
      typeof msg === 'string' ? msg : inspect(msg, { depth: null, colors: true }),
    )
    return `${prefix} ${formattedMessages.join(' ')}`
  }

  private getPrefix(level: LogLevel, fixer = ''): string {
    switch (level) {
      case 'error':
        return bold(red(`✗${fixer}`))
      case 'warn':
        return bold(yellow(`!${fixer}`))
      case 'info':
        return bold(blue(`i${fixer}`))
      case 'success':
        return bold(green(`✓${fixer}`))
      case 'debug':
        return bold(blue(`🔍${fixer}`))
    }
  }

  error(...messages: any[]): void {
    if (this.shouldLog('error'))
      console.error(this.formatMessage('error', messages))
  }

  warn(...messages: any[]): void {
    if (this.shouldLog('warn'))
      console.warn(this.formatMessage('warn', messages))
  }

  info(...messages: any[]): void {
    if (this.shouldLog('info'))
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('info', messages))
  }

  success(...messages: any[]): void {
    if (this.shouldLog('success'))
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('success', messages))
  }

  debug(...messages: any[]): void {
    if (this.shouldLog('debug'))
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('debug', messages))
  }

  title(message: string, ...msgs: any[]): void {
    // eslint-disable-next-line no-console
    console.log(`${bold(magenta(`📌 ${message}`))}\n`, ...msgs)
  }
}

const logger = new Logger()

// export const { error, warn, info, success, debug, title, setLevel } = logger
export const error = logger.error.bind(logger)
export const warn = logger.warn.bind(logger)
export const info = logger.info.bind(logger)
export const success = logger.success.bind(logger)
export const debug = logger.debug.bind(logger)
export const title = logger.title.bind(logger)
export const setLevel = logger.setLevel.bind(logger)

export const colors = {
  red,
  green,
  blue,
  yellow,
  bold,
  magenta,
}

export default logger
