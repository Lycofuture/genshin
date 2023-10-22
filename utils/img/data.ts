import { createHtml, screenshotByFile } from 'alemonjs'
import { writeFileSync } from 'fs'
import art from 'art-template'
import {AppName,DirPath} from "../../config";

/**
 * art
 * @param directory 文件
 * @param data  数据
 * @returns
 */
export function oImages(directory: string, data: object) {
  // 解析字符串
  const { template, AdressHtml } = createHtml(AppName, `${DirPath}${directory}`)
  writeFileSync(AdressHtml, art.render(template, data))
  // 截图
  return screenshotByFile(AdressHtml, {
    SOptions: { type: 'jpeg', quality: 90 },
    tab: 'body',
    timeout: 2000
  })
}
