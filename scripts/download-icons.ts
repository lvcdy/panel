import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { CATEGORIES } from '../src/data/links';

const API_BASE = "https://favicon.org.cn/get.php";
const API_KEY = "usr-9a1992c27bb0fff27d1a2e133c4a06b7d9cb7290";
const OUTPUT_DIR = path.resolve('public/icons');

async function syncIcons() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // 1. 提取 links.ts 中定义的所有有效域名
    const currentDomains = new Set(
        CATEGORIES.flatMap(cat => cat.links)
            .filter(link => link.url && link.url.startsWith('http'))
            .map(link => {
                try { return new URL(link.url).hostname; } catch { return null; }
            })
            .filter(Boolean)
    );

    console.log(`📊 扫描配置: 共 ${currentDomains.size} 个站点`);

    let newDownloads = 0;

    for (const domain of currentDomains) {
        const filePath = path.join(OUTPUT_DIR, `${domain}.png`);
        const errorPath = path.join(OUTPUT_DIR, `${domain}.error`);

        // 如果本地已存在图标或已确认抓取失败，则跳过
        if (fs.existsSync(filePath) || fs.existsSync(errorPath)) continue;

        try {
            console.log(`📡 正在同步新增站点: ${domain}...`);
            const response = await axios.get(`${API_BASE}?url=${domain}&size=128&key=${API_KEY}`, {
                responseType: 'arraybuffer',
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (response.data.byteLength > 500) {
                fs.writeFileSync(filePath, response.data);
                newDownloads++;
                console.log(`✅ 已保存: ${domain}.png`);
            }
            await new Promise(r => setTimeout(r, 200)); // 频率限制保护
        } catch (err: any) {
            // 标记错误，防止下次重复请求
            fs.writeFileSync(errorPath, '');
            console.warn(`⚠️  无法获取 ${domain} 图标，已跳过。`);
        }
    }

    console.log(`✨ 同步完成。新增: ${newDownloads}，本地缓存: ${currentDomains.size - newDownloads}`);
}

syncIcons();