# 编译vue dist前端文件
## 下载并运行ubuntu24.04 docker镜像（以此镜像为例，也可以使用其他OS系统）
### (1) 下载镜像
docker pull ubuntu:24.04
### (2) 运行镜像
docker run -it --name tfcenter-web --net=host  -d  ubuntu:24.04

## 下载tfcenter-web代码并编译
### (1) 下载代码
git clone https://github.com/tfcenter/tfcenter-web.git
#### 注：需安装git工具（ apt-get update; apt-get install git -y）
### (2) 运行vue代码
进入tfcenter-web目录
#### root@:/tfcenter-web# npm install
#### root@:/tfcenter-web# npm run serve
#### 注：需安装npm工具(apt-get install npm -y)

### (3) 编译vue代码，生成dist文件
#### root@:/tfcenter-web# npm run build
<img width="1166" height="461" alt="image" src="https://github.com/user-attachments/assets/ee8d662e-e87c-4ffc-b8ae-b9c61493c5ed" />

# 使用vue dist前端文件
### (1) 在tfcenter目录中新建static目录并拷贝dist目录的所有文件放到static目录中
<img width="650" height="135" alt="image" src="https://github.com/user-attachments/assets/d336c9a5-a6c6-46b7-99aa-7e70641d6a23" />

### (2) 重启tfcenter软件后生效（没有旧版入口标识，表示成功生效）
<img width="1315" height="694" alt="image" src="https://github.com/user-attachments/assets/1604f0be-573e-46a2-9c35-c680df90a46b" />
