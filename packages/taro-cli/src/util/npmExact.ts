import * as path from 'path'

import { resolveNpmFilesPath } from './resolve_npm_files'
import { INpmConfig, TogglableOptions } from './types'
import { BUILD_TYPES, REG_STYLE, NODE_MODULES } from './constants'
import { promoteRelativePath, recursiveFindNodeModules } from './index'

interface IArgs {
  npmName: string,
  filePath: string,
  isProduction: boolean,
  npmConfig: INpmConfig,
  buildAdapter: BUILD_TYPES,
  root: string,
  npmOutputDir: string,
  compileInclude: string[],
  env: object,
  uglify: TogglableOptions,
  babelConfig: object
}

const notExistNpmList: Set<string> = new Set()

export function getNpmOutputDir (outputDir: string, configDir: string, npmConfig: INpmConfig): string {
  let npmOutputDir
  if (!npmConfig.dir) {
    npmOutputDir = path.join(outputDir, npmConfig.name)
  } else {
    npmOutputDir = path.join(path.resolve(configDir, '..', npmConfig.dir), npmConfig.name)
  }
  return npmOutputDir
}

export function getExactedNpmFilePath ({
  npmName,
  filePath,
  isProduction,
  npmConfig,
  buildAdapter,
  root,
  npmOutputDir,
  compileInclude,
  env,
  uglify,
  babelConfig
}: IArgs) {
  try {
    const nodeModulesPath = recursiveFindNodeModules(path.join(root, NODE_MODULES))
    const npmInfo = resolveNpmFilesPath({
      pkgName: npmName,
      isProduction,
      npmConfig,
      buildAdapter,
      root,
      rootNpm: nodeModulesPath,
      npmOutputDir,
      compileInclude,
      env,
      uglify,
      babelConfig
    })
    const npmInfoMainPath = npmInfo.main
    let outputNpmPath
    if (REG_STYLE.test(npmInfoMainPath)) {
      outputNpmPath = npmInfoMainPath
    } else {
      outputNpmPath = npmInfoMainPath.replace(nodeModulesPath, npmOutputDir)
    }
    if (buildAdapter === BUILD_TYPES.ALIPAY) {
      outputNpmPath = outputNpmPath.replace(/@/g, '_')
    }
    const relativePath = path.relative(filePath, outputNpmPath)
    return promoteRelativePath(relativePath)
  } catch (err) {
    console.log(err)
    notExistNpmList.add(npmName)
    return npmName
  }
}

export function getNotExistNpmList () {
  return notExistNpmList
}
