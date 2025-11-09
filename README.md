# 编译vue dist前端文件
## 下载并运行ubuntu22.04 docker镜像（以此镜像为例，也可以使用其他OS系统）
(1) 下载镜像
docker pull ubuntu:22.04 
(2) 运行镜像
docker run -it --name tfcenter-web --net=host  -d  ubuntu:22.04

## 下载tfcenter-web代码并编译
（1）下载代码
git clone https://github.com/tfcenter/tfcenter-web.git
注：需安装git工具（ apt-get update; apt-get install git -y）


# 使用vue dist前端文件
