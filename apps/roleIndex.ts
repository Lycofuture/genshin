import { AMessage, plugin } from 'alemonjs'
import { screen } from '../lib/base'
import { index as role } from '../lib'

export class roleIndex extends plugin {
  constructor() {
    super({
      rule: [
        {
          reg: /^\/aaa$/,
          fnc: 'Hello'
        }
      ]
    })
  }

  async Hello(e: AMessage): Promise<boolean> {
    const data = await role.get()
    if (typeof data === 'object') {
      const img = await screen('roleIndex', data)
      if (typeof img != 'boolean') {
        await e.reply(img)
      }
    }
    return false
  }
}
