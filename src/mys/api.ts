import md5 from "md5";
import _ from "lodash";
import fetch, { Response } from "node-fetch";
import { getUrlMap } from "./tool";

/**
 * Api 参数
 * @param uid 游戏uid
 * @param cookie 米游社cookie
 * @param option 其他参数
 * @param game 游戏类型
 * @param option.log 是否显示日志
 * @param device 设备device_id
 * @param type 接口类型
 * @param data 请求传参
 */
interface ApiOptions {
  uid: number
  cookie: string
  game: string
  option?: object
  device?: string
  data?: object
}

export class MysApi {
  public uid: number
  public cookie: string
  public server: string
  public cacheCd: number
  public _device: string | undefined
  public option: object
  public game: string

  /**
   * @param e
   * @param option
   * @param isSr
   */
  constructor(
    e = {
      uid: 0,
      cookie: '',
      game: '',
      device: '',
      option: {}
    },
    option?: object,
    isSr?: string | boolean
  ) {
    this.option = option
    this.uid = e.uid
    this.cookie = e.cookie
    this.game = e.game
    this.server = this.getServer()
    /** 5分钟缓存 */
    this.cacheCd = 300
    this._device = e.device
    this.option = {
      log: true,
      ...e.option
    }
  }

  get device() {
    if (!this._device) {
      this._device = `Yz-${md5(this.uid.toString()).substring(0, 5)}`
    }
    return this._device
  }

  getUrl(type: string, data: any) {
    const urlMap = getUrlMap(this.uid, this.server, this.game, data)
    // eslint-disable-next-line prefer-const
    let { url, query = '', body = '' } = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)
    let headers: {
      'Cookie': string
      'Referer': string
      'User-Agent': string
      'x-rpc-app_version': string
      'x-rpc-client_type': string
      'DS': string
    }
    // eslint-disable-next-line prefer-const
    headers = this.getHeaders(query, body)

    return { url, headers, body }
  }

  getServer() {
    const uid = this.uid
    let isSr = false
    if (this.game === 'honkaisr') {
      isSr = true
    }
    switch (String(uid)[0]) {
      case '1':
      case '2':
        return isSr ? 'prod_gf_cn' : 'cn_gf01' // 官服
      case '5':
        return isSr ? 'prod_qd_cn' : 'cn_qd01' // B服
      case '6':
        return isSr ? 'prod_official_usa' : 'os_usa' // 美服
      case '7':
        return isSr ? 'prod_official_euro' : 'os_euro' // 欧服
      case '8':
        return isSr ? 'prod_official_asia' : 'os_asia' // 亚服
      case '9':
        return isSr ? 'prod_official_cht' : 'os_cht' // 港澳台服
    }
    return isSr ? 'prod_gf_cn' : 'cn_gf01'
  }

  async getData(
    type: string,
    data: any = {
      headers: {},
      seed_id: {}
    }
  ): Promise<any> {
    if (type === 'getFp') {
      data = { headers: {}, seed_id: this.generateSeed(16) }
    }
    // eslint-disable-next-line prefer-const
    let { url, headers, body } = this.getUrl(type, data)
    if (!url) return false

    headers.Cookie = this.cookie

    if (data.headers) {
      headers = { ...headers, ...data.headers }
    }

    const param = {
      headers,
      agent: null,
      timeout: 10000,
      method: ''
    }
    if (body) {
      param.method = 'post'
      param['body'] = body
    } else {
      param.method = 'get'
    }
    let response: Response
    const start = Date.now()
    try {
      response = await fetch(url, param)
    } catch (error) {
      console.error(error.toString())
      return false
    }

    if (!response.ok) {
      console.error(
        `[米游社接口][${type}][${this.uid}] ${response.status} ${response.statusText}`
      )
      return false
    }
    if (this.option['log']) {
      console.warn(`[米游社接口][${type}][${this.uid}] ${Date.now() - start}ms`)
    }

    const res = (await response.json()) || { api: start }

    if (!res) {
      console.warn('mys接口没有返回')
      return false
    }
    res['api'] = type
    return res
  }

  getHeaders(query?: string, body?: string) {
    let client: {
      app_version?: string
      client_type?: string
      User_Agent?: string
      Referer?: string
      Origin?: string
      X_Requested_With?: string
    }
    const cn = {
      app_version: '2.59.1',
      User_Agent: `Mozilla/5.0 (Linux; Android 13; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36 miHoYoBBS/2.59.1`,
      client_type: '5',
      Origin: 'https://webstatic.mihoyo.com',
      X_Requested_With: 'com.mihoyo.hyperion',
      Referer: 'https://webstatic.mihoyo.com'
    }
    const os = {
      app_version: '2.9.0',
      User_Agent: `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBSOversea/2.9.0`,
      client_type: '2',
      Origin: 'https://webstatic-sea.hoyolab.com',
      X_Requested_With: 'com.mihoyo.hoyolab',
      Referer: 'https://webstatic-sea.hoyolab.com'
    }
    if (this.server.startsWith('os')) {
      client = os
    } else {
      client = cn
    }
    return {
      'Cookie': '',
      'DS': this.getDs(query, body),
      'Referer': client.Referer,
      'User-Agent': client.User_Agent,
      'x-rpc-app_version': client.app_version,
      'x-rpc-client_type': client.client_type
    }
  }

  getDs(q?: string, b?: string) {
    let n = ''
    if (
      ['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn'].includes(this.server)
    ) {
      n = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs'
    } else if (/os_|official/.test(this.server)) {
      n = 'okr4obncj8bw5a65hbnn5oo6ixjc3l9w'
    }
    const t = Math.round(new Date().getTime() / 1000)
    const r = Math.floor(Math.random() * 90000 + 10000)
    const DS = md5(`salt=${n}&t=${t}&r=1${r}&b=${b}&q=${q}`)
    return `${t},1${r},${DS}`
  }

  /** 签到ds */
  getDsSign() {
    /** @Womsxd */
    const n = '6pNd5NnDnbwKxewrPwEoWlSYwhualS2H'
    const t = Math.round(new Date().getTime() / 1000)
    const r = _.sampleSize('abcdefghijklmnopqrstuvwxyz0123456789', 6).join('')
    const DS = md5(`salt=${n}&t=${t}&r=${r}`)
    return `${t},${r},${DS}`
  }

  /**
   * 返回字符串长度
   * @param length
   */
  generateSeed(length: number) {
    const characters = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters[Math.floor(Math.random() * characters.length)]
    }
    return result
  }
}
