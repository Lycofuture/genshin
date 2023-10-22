import { getAppPath } from 'alemonjs'
import { basename } from 'path'
// 目录地址
export const DirPath = getAppPath(import.meta.url)
// 目录名称
export const AppName = basename(DirPath)
