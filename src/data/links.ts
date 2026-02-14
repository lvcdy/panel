export const SEARCH_ENGINES = [
  { id: 'bing', name: 'Bing', url: 'https://cn.bing.com/search?q=', icon: 'fab fa-microsoft' },
  { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'fas fa-paw' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'fab fa-google' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', icon: 'fab fa-github' }
];

// 链接配置类型
export interface LinkItem {
  name: string;
  url: string;
  icon: string;
  color: string;
  useIcon?: boolean;
}

export interface Category {
  title: string;
  links: LinkItem[];
}

export const CATEGORIES: Category[] = [
  {
    title: "我的网站",
    links: [
      { name: "Blog", url: "https://blog.lvcdy.cn", icon: "fas fa-blog", color: "#ff5722", useIcon: false },
      { name: "Certd", url: "https://certd.lvcdy.cn", icon: "fas fa-certificate", color: "#2196f3", useIcon: false },
      { name: "Toolbox", url: "https://toolbox.lvcdy.cn", icon: "fas fa-toolbox", color: "#9c27b0", useIcon: false },
      { name: "api", url: "https://api.lvcdy.cn", icon: "fas fa-server", color: "#4caf50", useIcon: true }
    ]
  },
  {
    title: "Website",
    links: [
      { name: "哔哩哔哩", url: "https://www.bilibili.com", icon: "fab fa-bilibili", color: "#00aeec", useIcon: false },
      { name: "抖音", url: "https://www.douyin.com/", icon: "fab fa-tiktok", color: "#ff0050", useIcon: false }
    ]
  },
  {
    title: "AI",
    links: [
      { name: "DeepSeek", url: "https://chat.deepseek.com/", icon: "fas fa-robot", color: "#4d6bfe", useIcon: true },
      { name: "千问", url: "https://www.qianwen.com/", icon: "fas fa-robot", color: "#4d6bfe", useIcon: true },
      { name: "豆包", url: "https://www.doubao.com/", icon: "fas fa-robot", color: "#4d6bfe", useIcon: true }
    ]
  },
  {
    title: "Tools",
    links: [
      { name: "有道翻译", url: "https://fanyi.youdao.com/index.html#/TextTranslate", icon: "fas fa-language", color: "#e83e35", useIcon: true },
      { name: "Tsinghua Open Source", url: "https://mirrors.tuna.tsinghua.edu.cn", icon: "fas fa-server", color: "#663399", useIcon: true },
      { name: "itdog", url: "https://www.itdog.cn/", icon: "fas fa-dog", color: "#f39c12", useIcon: true },
      { name: "Prosettings", url: "https://prosettings.net/", icon: "fas fa-sliders-h", color: "#27ae60", useIcon: true },
      { name: "二维码识别", url: "https://jiema.wwei.cn/", icon: "fas fa-qrcode", color: "#3498db", useIcon: true },
      { name: "系统库", url: "https://www.xitongku.com/", icon: "fas fa-compact-disc", color: "#9b59b6", useIcon: true },
      { name: "active", url: "https://massgrave.dev/", icon: "fas fa-key", color: "#e67e22", useIcon: true },
      { name: "bootcn", url: "https://www.bootcdn.cn/", icon: "fas fa-bolt", color: "#f1c40f", useIcon: true },
      { name: "ping0", url: "https://ping0.cc", icon: "fas fa-wifi", color: "#1abc9c", useIcon: true },
      { name: "雨云", url: "https://app.rainyun.com/dashboard", icon: "fas fa-cloud", color: "#34ace0", useIcon: true },
      { name: "七牛云", url: "https://portal.qiniu.com/home", icon: "fas fa-cloud-upload-alt", color: "#007fff", useIcon: true },
      { name: "DNSPod", url: "https://console.dnspod.cn/", icon: "fas fa-network-wired", color: "#0052d9", useIcon: true },
      { name: "阿里云", url: "https://home.console.aliyun.com/home/dashboard/ProductAndService", icon: "fab fa-alipay", color: "#ff6a00", useIcon: true },
      { name: "rls", url: "https://rls.ovh/", icon: "fas fa-terminal", color: "#ed1c24", useIcon: true },
      { name: "举个栗子", url: "https://www.alcy.cc/", icon: "fas fa-chestnut", color: "#27ae60", useIcon: true },
      { name: "中国科学技术大学测速网站", url: "https://test.ustc.edu.cn/", icon: "fas fa-gauge-high", color: "#004098", useIcon: true },
      { name: "ip测漏", url: "https://ipcelou.com", icon: "fas fa-shield-alt", color: "#2c3e50", useIcon: true },
      { name: "双子星", url: "https://v2-dev.xsyd.top/", icon: "fas fa-star", color: "#f1c40f", useIcon: true },
      { name: "魔搭社区", url: "https://www.modelscope.cn/", icon: "fas fa-globe", color: "#16a085", useIcon: true }
    ]
  },
  {
    title: "学校",
    links: [
      { name: "智慧职教", url: "https://www.icve.com.cn/", icon: "fas fa-graduation-cap", color: "#e74c3c", useIcon: true },
      { name: "超星", url: "https://www.chaoxing.com/", icon: "fas fa-book", color: "#f39c12", useIcon: true },
      { name: "岗位实训综合管理平台", url: "https://lnsh.ipractice.com.cn/", icon: "fas fa-briefcase", color: "#34495e", useIcon: true },
      { name: "教务", url: "http://125.222.106.106/jsxsd/", icon: "fas fa-chalkboard-user", color: "#2980b9", useIcon: true },
      { name: "webvpn", url: "https://webvpn.lntu.edu.cn/", icon: "fas fa-lock", color: "#16a085", useIcon: true },
      { name: "智能化工虚拟仿真实训基地", url: "http://xnzypt.lnpc.edu.cn:8000/pc/#/login/account", icon: "fas fa-flask", color: "#27ae60", useIcon: true }
    ]
  },
  {
    title: "文献",
    links: [
      { name: "万方", url: "https://www.wanfangdata.com.cn/", icon: "fas fa-database", color: "#c0392b", useIcon: true },
      { name: "知网", url: "https://cnki.net/", icon: "fas fa-book-open", color: "#2c3e50", useIcon: true }
    ]
  }
];