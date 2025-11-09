const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // 让前端资源引用 /static/dist/... 
  // 必须设置，不然gin加载js和css将报错: Uncaught SyntaxError: Unexpected token '<'
  publicPath: process.env.NODE_ENV === 'production' ? '/static/dist' : '/',

  transpileDependencies: true,
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization'
    },

    host: '0.0.0.0', // 更改为局域网可访问，或者使用 'localhost'
    port: 23000,      // 更改默认端口为 3000
    open: false,      // 启动时自动打开浏览器

    allowedHosts: [
      'datamgmt.cn', // 允许访问的域名地址，即花生壳内网穿透的地址
      '.datamgmt.cn'   // .是二级域名的通配符
    ],
  },
});
