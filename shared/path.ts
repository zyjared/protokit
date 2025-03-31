import path from 'node:path'
import process from 'node:process'

export const resolve = (...p: string[]) => path.resolve(process.cwd(), ...p)
