import { readFileSync } from 'fs'
import { join } from 'path'
/**
 * 得到指定配置数据
 * @param name
 * @returns
 */
export function getJson(name: string) {
  return JSON.parse(
    readFileSync(join(process.cwd(), `/public/defset/${name}.json`), 'utf8')
  )
}
