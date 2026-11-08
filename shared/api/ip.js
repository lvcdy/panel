const MAX_TEXT_LENGTH = 200;

export const sanitizeText = (value, maxLength = MAX_TEXT_LENGTH) => {
  if (typeof value !== "string") return null;

  const trimmed = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();

  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const parseIpv4 = (value) => {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const numbers = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part.startsWith("0")) return null;

    const number = Number(part);
    if (!Number.isInteger(number) || number < 0 || number > 255) {
      return null;
    }
    numbers.push(number);
  }

  return numbers;
};

const isPublicIpv4 = (numbers) => {
  const [a, b, c] = numbers;

  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;

  return true;
};

const expandIpv6 = (value) => {
  const lower = value.toLowerCase();
  if (!/^[0-9a-f:]+$/.test(lower)) return null;
  if ((lower.match(/::/g) || []).length > 1) return null;

  let head = lower;
  let tail = "";

  if (lower.includes("::")) {
    const parts = lower.split("::");
    head = parts[0] ?? "";
    tail = parts[1] ?? "";
  }

  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];

  if (headParts.some((part) => !part) || tailParts.some((part) => !part)) {
    return null;
  }

  const fill = 8 - (headParts.length + tailParts.length);
  if (lower.includes("::")) {
    if (fill < 1) return null;
  } else if (fill !== 0) {
    return null;
  }

  const parts = [
    ...headParts,
    ...Array.from({ length: fill }, () => "0"),
    ...tailParts,
  ];

  if (parts.length !== 8) return null;

  const groups = [];
  for (const part of parts) {
    if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
    groups.push(Number.parseInt(part, 16));
  }

  return groups;
};

const isPublicIpv6 = (groups) => {
  const [g0, g1] = groups;

  if (groups.every((group) => group === 0)) return false;
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) {
    return false;
  }

  // Only global unicast 2000::/3 is considered public.
  if ((g0 & 0xe000) !== 0x2000) return false;

  // 2001:db8::/32 Documentation
  if (g0 === 0x2001 && g1 === 0x0db8) return false;
  // 2001:0000::/32 Teredo
  if (g0 === 0x2001 && g1 === 0x0000) return false;
  // 2001:10::/28 and 2001:20::/28 ORCHID
  if (g0 === 0x2001 && (g1 === 0x0010 || g1 === 0x0020)) return false;
  // 2002::/16 6to4 embeds an IPv4; reject to avoid private embedded addresses.
  if (g0 === 0x2002) return false;
  // 3fff::/20 Documentation
  if (g0 === 0x3fff && (g1 & 0xf000) === 0) return false;

  return true;
};

export const isIpLiteral = (value) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim().replace(/^\[|\]$/g, "");
  return Boolean(parseIpv4(trimmed) || expandIpv6(trimmed));
};

/** 仅接受平台可信来源传入的公网 IP；私网/保留/非法值返回 null */
export const normalizePublicIp = (value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().replace(/^\[|\]$/g, "");
  if (!trimmed || trimmed.includes("%") || trimmed.length > 64) return null;

  const ipv4 = parseIpv4(trimmed);
  if (ipv4) return isPublicIpv4(ipv4) ? trimmed : null;

  const ipv6 = expandIpv6(trimmed);
  if (ipv6) return isPublicIpv6(ipv6) ? trimmed.toLowerCase() : null;

  return null;
};

const BLOCKED_HOST_SUFFIXES = [
  "localhost",
  "local",
  "internal",
  "lan",
  "home.arpa",
  "arpa",
];

/** 状态检测只接受公共域名，不接受 IP 字面量、localhost、私有/保留名称 */
export const isValidStatusDomain = (value) => {
  if (typeof value !== "string") return false;

  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (!domain || domain.length > 253) return false;
  if (domain.includes(":") || domain.includes("/") || domain.includes("@")) {
    return false;
  }
  if (isIpLiteral(domain)) return false;

  if (BLOCKED_HOST_SUFFIXES.some(
    (suffix) => domain === suffix || domain.endsWith(`.${suffix}`),
  )) {
    return false;
  }

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  for (const label of labels) {
    if (
      !label ||
      label.length > 63 ||
      label.startsWith("-") ||
      label.endsWith("-") ||
      !/^[a-z0-9-]+$/.test(label)
    ) {
      return false;
    }
  }

  // 全数字 TLD 通常是 IP 的替代写法，直接拒绝。
  if (/^\d+$/.test(labels[labels.length - 1])) return false;

  return true;
};
