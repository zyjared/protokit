
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { program } from 'commander'
import { toBuffer } from '../shared/codec'
import logger from '../shared/logger'
import { resolveStorage } from '../shared/storage'

program
  .option('-i, --input <dir>', '输入目录', resolveStorage('data'))
  .option('-o, --output <dir>', '输出目录', resolveStorage('protoc-decoded'))
  .option('-c, --clean', '清空输出目录', true)
  .description(`使用 protoc 解码 protobuf 数据（需要安装 protoc）。该脚本用于和 proto-decode 比较效果。`)
  .parse(process.argv)

function checkProtoc() {
  try {
    execSync('protoc --version ', { stdio: 'ignore' })
  }
  catch {
    logger.error('protoc', '未找到 protoc 命令')
    logger.warn('protoc', '请先安装 Protocol Buffers')
    logger.info('protoc', '下载地址https://github.com/protocolbuffers/protobuf/releases')
    process.exit(1)
  }
}

function parseFile(inputFile: string, tryAgain = false) {
  const response = tryAgain ? fs.readFileSync(inputFile) : fs.readFileSync(inputFile, 'utf-8')

  const content = toBuffer(response)

  if (!content) {
    if (!tryAgain) {
      return parseFile(inputFile, true)
    }
    logger.error('protoc-decode 不支持的类型', `${inputFile}`)
    return null
  }

  const result = execSync('protoc --decode_raw', {
    input: content,
  })

  return result.toString()
}

/**
 * 解析目录下的所有 protobuf 响应。
 *
 * 数据文件本身是 utf-8 读取的，读取完其内容再做 base64 解码，然后再交给 protoc 解析。
 */
function processDirectory(inputDir: string, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true })

  const files = fs.readdirSync(inputDir)

  for (const file of files) {
    const inputPath = path.join(inputDir, file)
    if (fs.statSync(inputPath).isDirectory()) {
      processDirectory(inputPath, path.join(outputDir, file))
      continue
    }

    const outputPath = path.join(outputDir, `${path.parse(file).name}_Result.txt`)

    try {
      const result = parseFile(inputPath)
      if (!result) {
        continue
      }
      fs.writeFileSync(outputPath, result)
      logger.success('protoc', `处理成功：${file} -> ${path.basename(outputPath)}`)
    }
    catch (error) {
      logger.error('protoc', `处理失败：${file}`, error)
    }
  }
}

function main() {
  const {
    input,
    output,
    clean,
  } = program.opts()

  logger.title('protoc 开始解析 protobuf 数据')
  logger.info('protoc', `配置信息：
    输入目录: ${input}
    输出目录: ${output}
    清空目录: ${clean ? '是' : '否'}
    `)

  checkProtoc()

  if (fs.existsSync(output)) {
    if (!clean) {
      logger.error('protoc', '输出目录已存在，如需清空请添加 --clean 参数')
    }
    else {
      fs.rmSync(output, { recursive: true })
    }
  }

  processDirectory(input, output)
}

main()
