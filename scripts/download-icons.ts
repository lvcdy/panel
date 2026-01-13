import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { CATEGORIES } from '../src/data/links';

const API_BASE = "https://favicon.org.cn/get.php";
const API_KEY = "usr-9a1992c27bb0fff27d1a2e133c4a06b7d9cb7290";
const OUTPUT_DIR = path.resolve('public/icons');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function downloadIcon(url: string) {
    try {
        const domain = new URL(url).hostname;
        const filePath = path.join(OUTPUT_DIR, `${domain}.png`);
        const errorPath = path.join(OUTPUT_DIR, `${domain}.error`); // 错误标记文件

        // 如果图标已存在，或者之前已经确认抓取失败，则跳过
        if (fs.existsSync(filePath) || fs.existsSync(errorPath)) return; 

        console.log(`📡 正在尝试抓取: ${domain}...`);
        const response = await axios.get(`${API_BASE}?url=${domain}&size=128&key=${API_KEY}`, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' } // 模拟浏览器
        });

        fs.writeFileSync(filePath, response.data);
        console.log(`✅ 已保存: ${domain}.png`);
    } catch (err: any) {
        const domain = new URL(url).hostname;
        // 如果是 404，创建一个标记文件，避免下次 build 再次消耗配额尝试已失效的域名
        if (err.response?.status === 404) {
            fs.writeFileSync(path.join(OUTPUT_DIR, `${domain}.error`), '');
            console.warn(`⚠️  API 未找到图标 [${domain}]，已标记跳过。`);
        } else {
            console.error(`❌ 下载失败 [${url}]: ${err.message}`);
        }
    }
}

async function run() {
    console.log("🚀 开始同步任务...");
    const allLinks = CATEGORIES.flatMap(cat => cat.links);
    for (const link of allLinks) {
        if (link.url && link.url !== '#') {
            await downloadIcon(link.url);
        }
    }
    console.log("✨ 图标同步检查完成！");
}

run();