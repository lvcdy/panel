import { IP_API_PRIMARY } from "./config";

interface IpApiResponse {
    readonly ip?: string;
    readonly IP?: string;
    readonly as?: { readonly info?: string; readonly name?: string };
    readonly country?: { readonly name?: string; readonly code?: string } | string;
    readonly province?: { readonly name?: string; readonly code?: string } | string;
    readonly city?: { readonly name?: string; readonly code?: string } | string;
    readonly district?: { readonly name?: string; readonly code?: string } | string;
    readonly type?: string;
    readonly net?: string;
    readonly isp?: string;
    readonly regions?: readonly string[];
}

export const fetchIpInfo = async (ipEl: HTMLElement | null, ipBoxEl: HTMLElement | null) => {
    if (!ipEl || !ipBoxEl) return;

    try {
        let data: IpApiResponse | null = null;

        try {
            const res = await fetch(IP_API_PRIMARY, {
                cache: "no-store",
                signal: AbortSignal.timeout(30000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
        } catch (error) {
            console.warn("IP API 请求失败:", error);
            data = null;
        }

        let displayText = "";

        if (data) {
            let ip = "";
            let operator = "";
            let country = "";
            let province = "";
            let city = "";
            let district = "";
            let type = "";

            ip = data.ip || "";

            // 隐私保护：遮蔽 IP 中间段
            if (ip.includes(":")) {
                // IPv6: 保留首尾组，中间替换为 *
                const groups = ip.split(":");
                if (groups.length > 2) {
                    ip = groups[0] + ":*:*:" + groups[groups.length - 1];
                }
            } else if (ip.includes(".")) {
                // IPv4: 遮蔽中间两段
                const octets = ip.split(".");
                if (octets.length === 4) {
                    ip = `${octets[0]}.***.***.${octets[3]}`;
                }
            }

            operator = data.as?.info || data.as?.name || "";

            const countryData = data.country;
            country = typeof countryData === "object" ? (countryData?.name || countryData?.code || "") : (countryData || "");

            const provinceData = data.province;
            province = typeof provinceData === "object" ? (provinceData?.name || provinceData?.code || "") : (provinceData || "");

            const cityData = data.city;
            city = typeof cityData === "object" ? (cityData?.name || cityData?.code || "") : (cityData || "");

            const districtData = data.district;
            district = typeof districtData === "object" ? (districtData?.name || districtData?.code || "") : (districtData || "");

            type = data.type || data.net || "";

            // Fallback to regions if specific fields are missing
            if (!province && data.regions?.[0]) province = data.regions[0];
            if (!city && data.regions?.[1]) city = data.regions[1];
            if (!district && data.regions?.[2]) district = data.regions[2];

            const accessMethod = ip.includes(":") ? "IPv6" : "IPv4";

            // Format: Dual stack IP address (current IP) | Access method (IPv6/IPv4) | ISP | Country | Province | City | District | Type
            const parts = [
                ip,
                accessMethod,
                operator,
                country,
                province,
                city,
                district,
                type

            ].filter(Boolean);

            displayText = parts.join(" · ");
        }

        ipEl.innerText = displayText || "Enjoy your day";
    } catch (error) {
        console.error("获取 IP 信息发生异常:", error);
        ipEl.innerText = "Enjoy your day";
    } finally {
        ipBoxEl.style.opacity = "1";
        ipBoxEl.style.filter = "blur(0px)";
    }
};
