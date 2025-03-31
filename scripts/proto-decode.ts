import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { program } from 'commander'
import { toBuffer } from '../shared/codec'
import logger from '../shared/logger'
import { resolveStorage } from '../shared/storage'
import { proto } from '../src/core'

program
  .option('-i, --input <dir>', '输入目录', resolveStorage('data'))
  .option('-o, --output <dir>', '输出目录', resolveStorage('proto-decoded'))
  .option('--clean', '是否清空输出目录', false)
  .description('解析 proto 文件，并生成 json 文件')
  .parse(process.argv)

type DecodeType = 'req' | 'res'

const decodeTypes = {
  req: proto.Request,
  res: proto.Response,
} as const

function tryDecode(buffer: Uint8Array) {
  // 尝试解析
  let decodeType: DecodeType = 'req'
  let result
  for (const k in decodeTypes) {
    try {
      decodeType = k as DecodeType
      const f = decodeTypes[decodeType]
      result = f.decode(buffer)
      if (!result || !result.body) {
        continue
      }
      break
    }
    catch {
      // ignore
    }
  }

  return result && decodeType
    ? {
        type: decodeType,
        result,
      }
    : null
}

function decode(buffer: Uint8Array, type: DecodeType) {
  const f = decodeTypes[type]
  return f ? f.decode(buffer) : null
}

function processFile(inputFile: string, outputDir: string, tryAgain = false) {
  const raw = tryAgain
    ? fs.readFileSync(inputFile)
    : fs.readFileSync(inputFile, 'utf-8')

  const buffer = toBuffer(raw)

  // 确保读出的内容可处理
  // 如果是二进制文件，第二次尝试解析
  if (!buffer) {
    if (!tryAgain) {
      return processFile(inputFile, outputDir, true)
    }
    logger.error('proto-decode 不支持的类型', `${inputFile}`)
    return null
  }

  // 解码
  const ext = path.extname(inputFile).toLowerCase()
  const res = Object.hasOwn(decodeTypes, ext)
    ? { type: ext, result: decode(buffer, ext as DecodeType) }
    : tryDecode(buffer)

  if (!res) {
    logger.error('proto-decode 解析失败', `${inputFile}`)
    return null
  }

  const outputPath = path.join(
    outputDir,
    `${path.parse(inputFile).name}_${res.type.toUpperCase()}.json`,
  )
  fs.writeFileSync(outputPath, JSON.stringify(res.result, null, 2))

  logger.success(
    'proto-decode',
    '->',
    path.basename(outputPath),
  )

  return outputPath
}

function processDirectory(inputDir: string, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true })

  const files = fs.readdirSync(inputDir)

  if (files.length === 0) {
    logger.error('proto-decode', '未找到任何 proto 文件')
    return
  }

  for (const file of files) {
    const inputPath = path.join(inputDir, file)

    if (fs.statSync(inputPath).isDirectory()) {
      processDirectory(inputPath, path.join(outputDir, file))
      continue
    }

    try {
      processFile(inputPath, outputDir)
    }
    catch (error) {
      logger.error('proto-decode', '处理失败', file, error)
    }
  }
}

async function main() {
  const {
    input,
    output,
    clean,
  } = program.opts()
  logger.title('proto-decode 开始处理 protobuf 数据')
  logger.info(
    'proto-compile',
    `配置信息:
      输入目录: ${input}
      输出目录: ${output}
      清空目录: ${clean ? '是' : '否'}
      `,
  )

  const outputDir = path.resolve(output)
  if (clean && fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
  }

  processDirectory(input, outputDir)
}

main()
