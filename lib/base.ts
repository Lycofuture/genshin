import { oImages } from "../utils/img/data";
import { DirPath } from "../config";
import _ from "lodash";

/**
 * 截图
 * @param name 模板名
 * @param data 渲染数据
 */
export async function screen(
  name: string,
  data: object
): Promise<string | false | Buffer> {
  const path = '../../application/genshin'
  return await oImages(`/public/html/${name}/${name}.html`, {
    ...data,
    pluResPath: `${path}/public`,
    pluResName: name,
    Plugin: 'Genshin',
    defaultLayout: `${DirPath}/public/common/head/default.html`,
    headIndexStyle: `<style> .head_box { background: #f5f5f5 url(${path}/public/img/roleIndex/namecard/${_.random(
      1,
      8
    )}.png) no-repeat; background-position-x: 30px;  border-radius: 15px; font-family: tttgbnumber,serif; padding: 10px 20px; position: relative; background-size: auto 101%; }</style>`
  })
}
