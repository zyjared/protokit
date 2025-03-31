/**
 * 更多细节见文档
 *
 * @see https://github.com/protobufjs/protobuf.js/tree/f2ccb999220ee596d68c80b36265e5ee4ec877b3/cli
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { program } from 'commander'
import { x } from 'tinyexec'
import logger from '../shared/logger'
import { resolve } from '../shared/path'

program
  .option('-i, --input <dir>', '输入目录', resolve('./src/core/proto'))
  .option('-o, --output <dir>', '输出目录', resolve('./src/core/compile'))
  .option('-w, --wrap <type>', '包装器类型', 'es6')
  .option('--clean', '清空输出目录', false)
  .option('--lint', '使用 eslint 格式化（本地）', false)
  .parse(process.argv)

const options = program.opts()
processDirectory(options)

async function processDirectory(opts: Record<string, any>) {
  const {
    input: inputDir,
    output: outputDir,
    wrap,
    clean,
    lint,
  } = opts

  logger.title('proto-compile 开始编译 protobuf')
  logger.info('proto-compile', `配置信息:
  输入目录: ${inputDir}
  输出目录: ${outputDir}
  清空目录: ${clean ? '是' : '否'}
  包装器: ${wrap}
  Lint: ${lint ? '是' : '否'}
  `)

  if (clean && fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
  }

  fs.mkdirSync(outputDir, { recursive: true })

  // 获取所有 proto 文件
  const protoFiles = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.proto'))
    .map(file => path.join(inputDir, file))

  if (protoFiles.length === 0) {
    logger.error('proto-compile', '错误：未找到任何 proto 文件')
    process.exit(1)
  }

  const jsOutput = path.join(outputDir, 'proto.js')
  const jsResult = await x('pbjs', [
    '--target',
    'static-module',
    '--out',
    jsOutput,
    ...protoFiles,
    '--wrap',
    wrap,
    '--keep-case',
  ])
  logger.info('proto-compile', jsResult.stdout)
  // logger.success('proto-compile', '生成 js 模块：', jsOutput)

  // d.ts
  // 示例：pbjs -t static-module file1.proto file2.proto | pbts -o bundle.d.ts -
  const dtsOutput = path.join(outputDir, 'proto.d.ts')
  const tsResult = await x('pbts', ['-o', dtsOutput, jsOutput])
  logger.info('proto-compile', tsResult.stdout)
  // logger.success('proto-compile', '生成 ts 类型：', dtsOutput)

  // -------------------------------
  // 修复 import * as xxx 的报错
  // -------------------------------

  const jsContent = fs.readFileSync(jsOutput, 'utf8')
    .replace(/\* as/, '')

  fs.writeFileSync(jsOutput, jsContent)

  const dtsContent = fs.readFileSync(dtsOutput, 'utf8')
    .replace(/\* as/, '')
    .replace('import Long = require("long");', 'import type Long from "long";')

  fs.writeFileSync(dtsOutput, dtsContent)

  // lint
  if (lint) {
    await x('pnpm eslint', [outputDir, '--fix'])
    logger.success('proto-compile', 'eslint:', outputDir)
  }
}
