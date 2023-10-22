import { MysApi } from '../src'
import fs from 'node:fs'
import _ from 'lodash'
import cfg from './cfg'
import moment from 'moment'
import { DirPath } from '../config'

const imgFile = {}

export class index {
  private model: string
  private readonly area: object
  private areaName: any
  private cookie: any
  private game: any
  private readonly uid: any
  private other: any
  private wother: any

  constructor() {
    const user = JSON.parse(
      fs.readFileSync(process.cwd() + '/data/uid.json', 'utf-8')
    )
    this.cookie = user.cookie
    this.game = user.game
    this.uid = user.uid
    this.other = cfg.getdefSet('role', 'other')
    this.wother = cfg.getdefSet('weapon', 'other')
    this.model = 'roleIndex'
    this.area = {
      蒙德: 1,
      璃月: 2,
      雪山: 3,
      稻妻: 4,
      渊下宫: 5,
      层岩巨渊: 6,
      层岩地下: 7,
      须弥: 8
    }

    this.areaName = _.invert(this.area)
  }

  static async get(): Promise<object | boolean> {
    const roleIndex = new index()
    const res = await roleIndex.ApiData()
    if (res === false) return false
    return roleIndex.roleData(res)
  }

  async ApiData() {
    const e = cfg.usrt
    const mys = new MysApi(e)
    const res = []
    res.push(await mys.getData('index'))
    res.push(await mys.getData('spiralAbyss', { schedule_type: 1 }))
    res.push(await mys.getData('character'))
    res.push(await mys.getData('basicInfo'))
    if (!res || res[0]['retcode'] !== 0) return false
    /** 截图数据 */
    return res
  }

  roleData(res: any[]) {
    const [resIndex, resAbyss, resDetail, basicInfo] = res
    return {
      bg: _.random(1, 8),
      uid: this.uid,
      activeDay: this.dayCount(resIndex.data.stats['active_day_number']),
      avatars: this.roleList(resDetail.data.avatars),
      line: this.Details(resIndex.data.stats),
      basicInfo,
      abyss: this.abyssAll(resDetail.data.avatars, resAbyss.data)
    }
  }

  /**
   * 角色列表
   * @param avatars
   * @param chosen 是否只要展示角色
   * @returns {any[]}
   */
  roleList(avatars: any, chosen = false): any[] {
    avatars = _.orderBy(avatars, ['rarity'], ['desc'])
    if (chosen) avatars = avatars.slice(0, 8)
    const element = cfg.getdefSet('element', 'role')
    for (const i in avatars) {
      if (avatars[i].id === 10000005) avatars[i].name = '空'
      if (avatars[i].id === 10000007) avatars[i].name = '荧'
      avatars[i].element = element[avatars[i].name]
      avatars[i].img = imgFile[avatars[i].name] || `${avatars[i].name}.png`
      if (avatars[i]['weapon'])
        avatars[i]['weapon'].showName =
          this.wother.sortName[avatars[i].weapon.name] ?? avatars[i].weapon.name
    }
    return avatars
  }

  /**
   * 活跃天数格式化
   * @param num 天数
   * @returns {string} 年月日
   */
  dayCount(num: number): string {
    const yea = Math.floor(num / 365)
    const month = Math.floor((num % 365) / 30.41)
    const day = Math.floor((num % 365) % 30.41)
    let msg = ''
    if (yea > 0) {
      msg += yea + '年'
    }
    if (month > 0) {
      msg += month + '个月'
    }
    if (day > 0) {
      msg += day + '天'
    }
    return msg
  }

  /**
   * 详情部分
   * @param stats
   * @returns {([{num: *, lable: string},{num: *, lable: string},{num: *, lable: string},{num: *, lable: string},{num: *, lable: string}]|[{num: *, lable: string},{num: *, lable: string},{num: *, lable: string},{num: *, lable: string},{num: *, lable: string}]|[{num: *, lable: string},{num: *, lable: string},{num: *, lable: string},{num: *, lable: string},{num: *, lable: string}]|[{num: *, lable: string},{num: *, lable: string},{num: string, lable: string},{num: string, lable: string}])[]}
   * @constructor
   */
  Details(stats: {
    active_day_number: any
    spiral_abyss: any
    way_point_number: any
    domain_number: any
    achievement_number: any
    avatar_number: any
    luxurious_chest_number: any
    precious_chest_number: any
    exquisite_chest_number: any
    common_chest_number: any
    magic_chest_number: any
    dendroculus_number: any
    electroculus_number: any
    geoculus_number: any
    anemoculus_number: any
    hydroculus_number: any
  }): (
    | [
        { num: any; lable: string },
        { num: any; lable: string },
        { num: any; lable: string },
        { num: any; lable: string },
        { num: any; lable: string }
      ]
    | [
        { num: any; lable: string },
        { num: any; lable: string },
        { num: string; lable: string },
        { num: string; lable: string }
      ]
  )[] {
    return [
      [
        // { lable: '等级', num: res.role.level ?? 0 },
        { lable: '活跃天数', num: stats.active_day_number },
        { lable: '深境螺旋', num: stats.spiral_abyss },
        { lable: '解锁传送点', num: stats.way_point_number },
        { lable: '解锁秘境', num: stats.domain_number },
        { lable: '达成成就', num: stats.achievement_number }
      ],
      [
        { lable: '获得角色', num: stats.avatar_number },
        {
          lable: '总宝箱',
          num:
            stats.luxurious_chest_number +
            stats.precious_chest_number +
            stats.exquisite_chest_number +
            stats.common_chest_number +
            stats.magic_chest_number
        },
        { lable: '华丽宝箱', num: stats.luxurious_chest_number },
        { lable: '珍贵宝箱', num: stats.precious_chest_number },
        { lable: '精致宝箱', num: stats.exquisite_chest_number }
      ],
      [
        { lable: '普通宝箱', num: stats.common_chest_number },
        { lable: '奇馈宝箱', num: stats.magic_chest_number },
        { lable: '草神瞳', num: stats.dendroculus_number },
        { lable: '雷神瞳', num: stats.electroculus_number },
        { lable: '岩神瞳', num: stats.geoculus_number }
      ],
      [
        { lable: '风神瞳', num: stats.anemoculus_number },
        { lable: '水神瞳', num: stats.hydroculus_number },
        { lable: '火神瞳', num: '待实装' },
        { lable: '冰神瞳', num: '待实装' }
      ]
    ]
  }

  /**
   * 处理深渊数据
   * @param roleArr
   * @param resAbyss
   * @returns {object}
   */
  abyssAll(roleArr: string | any[], resAbyss: any): object | boolean {
    const abyss = {}
    if (!(resAbyss ? resAbyss['reveal_rank'] : undefined)) return false
    if (roleArr.length <= 0) {
      return abyss
    }
    if (resAbyss?.total_battle_times <= 0) {
      return abyss
    }
    if (resAbyss?.reveal_rank.length <= 0) {
      return abyss
    }
    // 打了三层才放出来
    if (resAbyss?.floors.length <= 2) {
      return abyss
    }

    const startTime = moment(resAbyss.startTime)
    // @ts-ignore
    let time: string | number = Number(startTime.month()) + 1
    // @ts-ignore
    if (startTime.day() >= 15) {
      time = time + '月下'
    } else {
      time = time + '月上'
    }

    let totalStar: string | number = 0
    const star = []
    for (const val of resAbyss['floors']) {
      if (val.index < 9) {
        continue
      }
      totalStar += val.star
      star.push(val.star)
    }
    totalStar = totalStar + '（' + star.join('-') + '）'

    const dataName = [
      'damage',
      'take_damage',
      'defeat',
      'normal_skill',
      'energy_skill'
    ]
    const data = []
    const tmpRole = []
    for (const val of dataName) {
      if (resAbyss[`${val}_rank`].length <= 0) {
        resAbyss[`${val}_rank`] = [
          {
            value: 0,
            avatar_id: 10000007
          }
        ]
      }
      data[val] = {
        num: resAbyss[`${val}_rank`][0].value,
        name: cfg.roleIdToName(resAbyss[`${val}_rank`][0].avatar_id)
      }

      if (data[val].num > 1000) {
        data[val].num = (data[val].num / 10000).toFixed(1)
        data[val].num += ' w'
      }

      if (
        tmpRole.length < 4 &&
        !tmpRole.includes(resAbyss[`${val}_rank`][0].avatar_id)
      ) {
        tmpRole.push(resAbyss[`${val}_rank`][0].avatar_id)
      }
    }

    const list = []

    const avatar = _.keyBy(roleArr, 'id')

    for (const val of resAbyss['reveal_rank']) {
      if (avatar[val.avatar_id]) {
        val.life = avatar[val.avatar_id].actived_constellation_num
      } else {
        val.life = 0
      }
      val.name = cfg.roleIdToName(val.avatar_id)
      list.push(val)
    }

    return {
      time,
      max_floor: resAbyss.max_floor,
      totalStar,
      list,
      total_battle_times: resAbyss.total_battle_times,
      ...data
    }
  }
}
