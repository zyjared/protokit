import fs from 'node:fs'
import path from 'node:path'
import logger from './logger'
import { resolve } from './path'

/**
 * 可以在 /.storage/data.json 中存储,
 * 这更多是用来做类型提示的。
 */

interface Data {
  cookie: string
  token: string
  sequence_id: number
  webid: string
  fp: string

  conversation?: {
    conversation_short_id?: string
    conversation_id?: string
  }
  send_query?: string
  conversation_index?: string
  mark_read?: {
    badge_count?: number
    read_badge_count?: number
    read_index?: string
  }
}

export const storageDir = resolve('.storage')
export const resolveStorage = (...p: string[]) => resolve(storageDir, ...p)
const dataPath = 'data.json'

/**
 * 通用读取数据的方式
 *
 * @internal
 */
export function readJson(filename: string) {
  try {
    const filepath = resolve(storageDir, filename)
    if (!fs.existsSync(filepath)) {
      return {}
    }

    const content = fs.readFileSync(filepath, 'utf-8')

    return JSON.parse(content) || {}
  }
  catch (error) {
    console.error('读取数据失败:', error)
    return {}
  }
}

/**
 * 通用的写入数据的方式
 *
 * @internal
 */
export function writeJson(filename: string, data?: Record<string, any>, log?: boolean) {
  if (!data) {
    return
  }
  try {
    const filepath = resolve(storageDir, filename)
    const dir = path.dirname(filepath)

    fs.mkdirSync(dir, { recursive: true })
    const d = JSON.stringify(data, null, 2)
    fs.writeFileSync(filepath, d)

    log && logger.info(data, '\n已保存', filepath)
  }
  catch (error) {
    logger.error('写入数据失败:', error)
  }
}

interface GetData {
  (): Data
  cache?: Data
}

/**
 * 获得特数据
 *
 * 比如 cookie, token
 *
 * @internal
 */
export const getData: GetData = (): Data => {
  if (getData.cache) {
    return getData.cache
  }

  getData.cache = readJson(dataPath) as Data

  return getData.cache
}

/**
 * 通用的存储数据方式
 *
 * @internal
 */
export function saveData(data?: Partial<Data> | null, log?: boolean) {
  if (!data) {
    return
  }

  const d = {
    ...getData(),
    ...data,
  }
  getData.cache = d
  writeJson(dataPath, d, log)
}
