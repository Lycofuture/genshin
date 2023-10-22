import YAML from "yaml";
import chokidar from "chokidar";
import fs from "node:fs";
import { promisify } from "node:util";
import _ from "lodash";
import { DirPath } from "../config";

/** 配置文件 */
class cfg {
  private readonly defSetPath: string
  private defSet: object
  private readonly configPath: string
  private config: object
  private readonly watcher: { config: object; defSet: object }
  private ignore: string[]
  private nameID: any

  constructor() {
    /** 默认设置 */
    this.defSetPath = DirPath + '/defSet/'
    this.defSet = {}

    /** 用户设置 */
    this.configPath = DirPath + '/config/'
    this.config = {}

    /** 监听文件 */
    this.watcher = { config: {}, defSet: {} }

    this.ignore = ['mys.pubCk', 'gacha.set', 'bot.help', 'role.name']
  }

  get usrt() {
    const data = fs.readFileSync(DirPath + '/data/uid.json', 'utf-8')
    return JSON.parse(data)
  }

  get element() {
    return {
      ...this.getdefSet('element', 'role'),
      ...this.getdefSet('element', 'weapon')
    }
  }

  /**
   * @param app  功能
   * @param name 配置文件名称
   */
  getdefSet(app: string, name: string) {
    return this.getYaml(app, name, 'defSet')
  }

  /** 用户配置 */
  getConfig(app: string, name: string) {
    if (this.ignore.includes(`${app}.${name}`)) {
      return this.getYaml(app, name, 'config')
    }

    return {
      ...this.getdefSet(app, name),
      ...this.getYaml(app, name, 'config')
    }
  }

  /**
   * 获取配置yaml
   * @param app 功能
   * @param name 名称
   * @param type 默认跑配置-defSet，用户配置-config
   */
  getYaml(app: string, name: string, type: string) {
    const file = this.getFilePath(app, name, type)
    const key = `${app}.${name}`

    if (this[type][key]) return this[type][key]

    try {
      this[type][key] = YAML.parse(fs.readFileSync(file, 'utf8'))
    } catch (error) {
      console.error(`[${app}][${name}] 格式错误 ${error}`)
      return false
    }

    this.watch(file, app, name, type)

    return this[type][key]
  }

  getFilePath(app: string, name: string, type: string) {
    if (type == 'defSet') return `${this.defSetPath}${app}/${name}.yaml`
    else return `${this.configPath}${app}.${name}.yaml`
  }

  /** 监听配置文件 */
  watch(file: string, app: string, name: string, type = 'defSet') {
    const key = `${app}.${name}`

    if (this.watcher[type][key]) return

    const watcher = chokidar.watch(file)
    watcher.on('change', path => {
      delete this[type][key]
      console.warn(`[修改配置文件][${type}][${app}][${name}]`)
      if (this[`change_${app}${name}`]) {
        this[`change_${app}${name}`]()
      }
    })

    this.watcher[type][key] = watcher
  }

  /** 读取所有用户绑定的ck */
  async getBingCk() {
    const ck = {}
    const ckQQ = {}
    const noteCk = {}
    const dir = './data/MysCookie/'
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.yaml'))

    const readFile = promisify(fs.readFile)

    const promises = []

    files.forEach(v => promises.push(readFile(`${dir}${v}`, 'utf8')))

    const res = await Promise.all(promises)

    res.forEach(v => {
      const tmp = YAML.parse(v)
      let qq: any
      _.forEach(tmp, (item: any, uid) => {
        qq = item['qq']
        ck[String(uid)] = item
        if (item['isMain'] && !ckQQ[String(item['qq'])]) {
          ckQQ[String(item['qq'])] = item
        }
      })
      if (qq && !ckQQ[String(qq)]) {
        ckQQ[String(qq)] = Object.values(tmp)[0]
      }
      noteCk[String(qq)] = tmp
    })

    return { ck, ckQQ, noteCk }
  }

  /** 获取qq号绑定ck */
  getBingCkSingle(userId: number) {
    const file = `./data/MysCookie/${userId}.yaml`
    try {
      let ck = fs.readFileSync(file, 'utf-8')
      ck = YAML.parse(ck)
      return ck
    } catch (error) {
      return {}
    }
  }

  saveBingCk(userId: number, data: any) {
    const file = `./data/MysCookie/${userId}.yaml`
    if (_.isEmpty(data)) {
      fs.existsSync(file) && fs.unlinkSync(file)
    } else {
      const yaml = YAML.stringify(data)
      fs.writeFileSync(file, yaml, 'utf8')
    }
  }

  /**
   * 原神角色id转换角色名字
   */
  roleIdToName(id: number) {
    const name = this.getdefSet('role', 'name')
    if (name[id]) {
      return name[id][0]
    }

    return ''
  }

  /**
   * 原神武器id转换成武器名字
   */
  getWeaponDataByWeaponHash(hash: string | number) {
    const data = this.getdefSet('weapon', 'data')
    const weaponData = {
      name: '',
      type: '',
      icon: ''
    }
    weaponData.name = data.Name[hash]
    weaponData.type = data.Type[weaponData.name]
    weaponData.icon = data['Icon'][weaponData.name]
    return weaponData
  }

  /** 原神角色别名转id */
  roleNameToID(keyword: number) {
    this.getAbbr()
    const roelId = this.nameID.get(String(keyword))
    return roelId || false
  }

  /** 获取角色别名 */
  getAbbr() {
    if (this.nameID) return

    this.nameID = new Map()

    const nameArr = this.getdefSet('role', 'name')
    const nameArrUser = this.getConfig('role', 'name')

    const nameID = {}

    for (const i in nameArr) {
      nameID[nameArr[i][0]] = i
      for (const abbr of nameArr[i]) {
        this.nameID.set(String(abbr), i)
      }
    }

    for (const i in nameArrUser) {
      for (const abbr of nameArrUser[i]) {
        this.nameID.set(String(abbr), nameID[i])
      }
    }
  }

  /** 返回所有别名，包括用户自定义的 */
  getAllAbbr() {
    const nameArr = this.getdefSet('role', 'name')
    const nameArrUser = this.getConfig('role', 'name')

    for (const i in nameArrUser) {
      const id = this.roleNameToID(Number(i))
      nameArr[id] = nameArr[id].concat(nameArrUser[i])
    }

    return nameArr
  }

  /**
   * 原神角色武器长名称缩写
   * @param name 名称
   * @param isWeapon 是否武器
   */
  shortName(name: string, isWeapon = false) {
    let other = {
      sortName: ''
    }
    if (isWeapon) {
      other = this.getdefSet('weapon', 'other')
    } else {
      other = this.getdefSet('role', 'other')
    }
    return other.sortName[name] ?? name
  }

  getGachaSet(groupId = '') {
    const config = this.getYaml('gacha', 'set', 'config')
    const def = config.default
    if (config[groupId]) {
      return { ...def, ...config[groupId] }
    }
    return def
  }

  getMsgUid(msg: string) {
    const ret = /[1|2,5-9][0-9]{8}/g.exec(msg)
    if (!ret) return false
    return ret[0]
  }

  /**
   * 获取消息内原神角色名称，uid
   * @param msg 判断消息
   * @param filterMsg 过滤消息
   * @return boolean 角色id
   * @return name 角色名称
   * @return alias 当前别名
   * @return { object } 游戏uid
   */
  getRole(msg: string, filterMsg = '') {
    /** 获取角色名 */
    let alias = msg.replace(/#|老婆|老公|[1|2,5-9][0-9]{8}/g, '').trim()
    if (filterMsg) {
      alias = alias.replace(new RegExp(filterMsg, 'g'), '').trim()
    }

    /** 判断是否命中别名 */
    const roleId = this.roleNameToID(Number(alias))
    if (!roleId) return false
    /** 获取uid */
    const uid = this.getMsgUid(msg) || ''

    return {
      roleId,
      uid,
      alias,
      name: this.roleIdToName(roleId)
    }
  }

  cpCfg(app: string, name: string) {
    if (!fs.existsSync('./plugins/genshin/config')) {
      fs.mkdirSync('./plugins/genshin/config')
    }

    const set = `./plugins/genshin/config/${app}.${name}.yaml`
    if (!fs.existsSync(set)) {
      fs.copyFileSync(`./plugins/genshin/defSet/${app}/${name}.yaml`, set)
    }
  }

  /**
   * 根据角色名获取对应的元素类型
   */
  getElementByRoleName(roleName: string | number) {
    const element = this.getdefSet('element', 'role')
    if (element[roleName]) {
      return element[roleName]
    }
  }

  /**
   * 根据技能id获取对应的技能数据,角色名用于命座加成的技能等级
   */
  getSkillDataByskillId(skillId: string | number, roleName: string | number) {
    const skillMap = this.getdefSet('skill', 'data')
    const skillData = {
      name: '',
      icon: '',
      talent: ''
    }
    if (skillMap.Name[skillId]) {
      skillData.name = skillMap.Name[skillId]
    }
    if (skillMap['Icon'][skillId]) {
      skillData.icon = skillMap['Icon'][skillId]
    }
    if (skillMap['Talent'][roleName]) {
      skillData.talent = skillMap['Talent'][roleName]
    }
    return skillData
  }

  fightPropIdToName(propId: string | number) {
    const propMap = this.getdefSet('prop', 'prop')
    if (propMap[propId]) {
      return propMap[propId]
    }
    return ''
  }

  getRoleTalentByTalentId(talentId: string | number) {
    const talentMap = this.getdefSet('role', 'talent')
    const talent = {
      name: '',
      icon: ''
    }
    if (talentMap.Name[talentId]) {
      talent.name = talentMap.Name[talentId]
    }
    if (talentMap['Icon'][talentId]) {
      talent.icon = talentMap['Icon'][talentId]
    }
    return talent
  }
}

export default new cfg()
