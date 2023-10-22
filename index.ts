import { createApps } from 'alemonjs'
import * as index from './apps/roleIndex'

const apps = createApps(import.meta.url)
apps.component(index)
apps.mount()
console.info('原神,启动!')
