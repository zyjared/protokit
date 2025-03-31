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

  setLevel(level: LogLevel) {
    this.level = level
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
    const prefix = this.getPrefix(level)
    const formattedMessages = messages.map(msg =>
      typeof msg === 'string' ? msg : inspect(msg, { depth: null, colors: true }),
    )
    return `${prefix} ${formattedMessages.join(' ')}`
  }

  private getPrefix(level: LogLevel): string {
    switch (level) {
      case 'error':
        return bold(red('✗'))
      case 'warn':
        return bold(yellow('!'))
      case 'info':
        return bold(blue('i'))
      case 'success':
        return bold(green('✓'))
      case 'debug':
        return bold(blue('🔍'))
    }
  }

  error(...messages: any[]) {
    if (this.shouldLog('error'))
      console.error(this.formatMessage('error', messages))
  }

  warn(...messages: any[]) {
    if (this.shouldLog('warn'))
      console.warn(this.formatMessage('warn', messages))
  }

  info(...messages: any[]) {
    if (this.shouldLog('info'))
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('info', messages))
  }

  success(...messages: any[]) {
    if (this.shouldLog('success'))
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('success', messages))
  }

  debug(...messages: any[]) {
    if (this.shouldLog('debug'))
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('debug', messages))
  }

  title(message: string, ...msgs: any[]) {
    // eslint-disable-next-line no-console
    console.log(`${bold(magenta(`📌 ${message}`))}\n`, ...msgs)
  }
}

const logger = new Logger()

export const { error, warn, info, success, debug, title, setLevel } = logger
export default logger
