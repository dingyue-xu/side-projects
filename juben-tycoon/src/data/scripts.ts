import type { OwnedScript } from '../types'

// 出本：开局可选的首发本（acquiredDay 在购买时回填）
export const STARTER_SCRIPTS: Omit<OwnedScript, 'acquiredDay'>[] = [
  {
    id: 's_yanyu',
    name: '《烟雨长歌》',
    genre: '情感本',
    quality: 82,
    heat: 78,
    original: false,
    // 城市发行情感本，眼泪收割机，复购靠演员撑
  },
  {
    id: 's_guiyu',
    name: '《鬼域电台》',
    genre: '恐怖本',
    quality: 75,
    heat: 85,
    original: false,
    // 恐怖机制本，吃装修和声光电，沉浸感低了会被吐槽
  },
  {
    id: 's_chenmo',
    name: '《沉默的证词》',
    genre: '硬核推理',
    quality: 88,
    heat: 62,
    original: false,
    // 硬核盒装，口碑好但受众窄、热度起得慢
  },
  {
    id: 's_yuanchuang',
    name: '《胡同十三号》',
    genre: '原创情感',
    quality: 79,
    heat: 70,
    original: true,
    // 你的原创本！独一份，但会被友商盯上抄袭/盗版
  },
]
