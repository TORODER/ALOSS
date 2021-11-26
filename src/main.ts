import { bootstrap } from "./bootstrap";
import { runServerConfig, runServerTestOptions } from "./config/static.config";

(async () => {
    // from static.config  读取内容来启动服务器
    // 这样设计是为了方便测试(test)
    await bootstrap(runServerConfig, runServerTestOptions);
})();
