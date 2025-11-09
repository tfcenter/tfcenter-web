let API_BASE_URL = ""; // 先定义一个变量
let HOME_BASE_URL = ""; // 先定义一个变量


const protocol = window.location.protocol;
const hostname = window.location.hostname; // 不能hostname跨IP访问，否则session取不到数据
const port = window.location.port;
// const port = 8866

HOME_BASE_URL = `${protocol}//${hostname}${port ? ':' + port : ''}`;
API_BASE_URL = HOME_BASE_URL + "/api/tf/v1" // API基础地址

export { HOME_BASE_URL }; // 正确的导出方式
export { API_BASE_URL }; // 正确的导出方式
