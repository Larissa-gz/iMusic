import { app, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

if (process.env.NODE_ENV === 'development') {
  app.setPath('userData', path.resolve(app.getPath('appData'), './iMusic-dev'))
}

// 未登录ID为global
const LOCAL_USER_ID = 'global'

// 记录当前用户
let user = {
  // 用户ID
  id: LOCAL_USER_ID,
  // 用户目录路径
  path: '',
  // 用户配置数据
  config: {}
}

/**
 * 确保用户目录存在
 * @param  {String} id 用户ID, 未登录时为global
 * @return {String} 用户目录文件夹
 */
function ensureUserPath (id = LOCAL_USER_ID) {
  const userPath = path.join(app.getPath('userData'), `./user/${id}`)
  try {
    fs.accessSync(userPath, fs.F_OK)
  } catch (err) {
    mkdir(userPath)
  }
  return userPath
}

/**
 * 更新用户配置信息, 并保存到本地目录
 * @param  {Object} data   用户配置
 */
function updateUserConfig (data) {
  user.config = data
  writeFile(file, obj)
}

/**
 * 同步创建目录, 支持多层级
 * @param  {String} dirname 目录路径
 * @return {Boolean}        创建是否成功
 */
function mkdir (dirname) {
  try {
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (mkdir(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  } catch (err) {
    console.error('create dir failed', err)
    return false
  }
}

/**
 * 写入文件
 * @param  {String} file 文件路径
 * @param  {Object|String} data 写入的内容
 * @param  {Boolean} append 是否为追加模式, 默认false为覆盖原文件
 */
function writeFile (file, data, append = false, encoding = 'utf8') {
  try {
    const buffer = Buffer.from(JSON.stringify(data))
    fs.writeFileSync(file, buffer, {
      encoding,
      flag
    })
  } catch (err) {
    console.log('write file failed', err)
  }
}

/**
 * 读取文件
 * @param  {String} file 文件路径
 * @return {Object|String|Undefined}
 */
function readFile (file) {
  try {
    const result = fs.readFileSync(file)
    return JSON.parse(result.toString())
  } catch (err) {
    console.warn('user config not exist', err)
  }
}

/**
 * 监听登录用户是否变化
 */
ipcMain.on('set-user', (event, id) => {
  const userId = id || LOCAL_USER_ID
  if (userId === user.id) return
  const userPath = ensureUserPath(userId)
  const userConfigFile = path.join(userPath, './config.json')
  user = {
    id: userId,
    path: userPath,
    config: readFile(userConfigFile) || {}
  }
})

/**
 * 监听登录配置数据是否更新
 */
ipcMain.on('update-user-config', (event, config) => {
  // 一定时间后才进行写入操作, 避免频繁IO
  if (updateUserConfig.timer) clearTimeout(updateUserConfig.timer)
  updateUserConfig.timer = setTimeout(() => {
    updateUserConfig(config)
  }, 1000)
})

export default {
  get userId () {
    return user.id
  },
  ensureUserPath
}
