# 编译vue dist前端文件
## 下载并运行ubuntu22.04 docker镜像（以此镜像为例，也可以使用其他OS系统）
### (1) 下载镜像
docker pull ubuntu:22.04 
### (2) 运行镜像
docker run -it --name tfcenter-web --net=host  -d  ubuntu:22.04

## 下载tfcenter-web代码并编译
### (1) 下载代码
git clone https://github.com/tfcenter/tfcenter-web.git
注：需安装git工具（ apt-get update; apt-get install git -y）
### (2) 运行vue代码
进入tfcenter-web目录
root@:/opt/tfcenter-web# npm install
root@:/opt/tfcenter-web# npm run serve
注：需安装npm工具(apt-get install npm -y)

### (3) 编译vue代码，生成dist文件
root@:/opt/tfcenter-web# npm run build

# 使用vue dist前端文件
