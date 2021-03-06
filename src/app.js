const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const session = require('koa-generic-session')
const redisStore = require('koa-redis')
const {
  REDIS_CONF
} = require('./conf/db')
const {
  isProd
} = require('./utils/env')

const errorViewRoute = require('./routes/view/error')
const index = require('./routes/index')
const users = require('./routes/users')

// error handler
let onerrorConf = {}
if (isProd) { // 成产环境跳转到错误页
  onerrorConf = {
    redirect: '/error'
  }
}

onerror(app, onerrorConf)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public')) // 将public注册为静态文件 在url中 通过文件路径可以直接访问
app.use(views(__dirname + '/views', {
  extension: 'ejs'
})) // 注册node 字符串模版文件

// session 配置
app.keys = ['UIsdf_7878#$'] // 加密 密匙
app.use(session({
  key: 'weibo_sid', // cookie name 默认是 'koa_sid'
  perfix: 'weibo:sess', // redis key 的前缀 默认是 'koa:sess：' 
  cookie: {
    path: '/', // cookie 路径 
    httpOnly: true, // 不允许客户端修改cookie
    maxAge: 24 * 60 * 60 * 1000 // cookie 过期时间
  },
  // ttl: 24 * 60 * 60 * 1000, // redis 过期时间 默认的配置是和cookie的过期时间一致
  store: redisStore({
    all: `${REDIS_CONF.host}:${REDIS_CONF.port}`
  })
}))

// logger  中间件演示
// app.use(async (ctx, next) => {
//   const start = new Date()
//   await next()
//   const ms = new Date() - start
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
// })

// routes

app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
// 404 路由注册到最下面
app.use(errorViewRoute.routes(), errorViewRoute.allowedMethods())

// error-handling  
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

module.exports = app