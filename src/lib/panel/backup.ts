import { clonePanelConfig } from "./defaults";
import type { PanelCategory, PanelConfig, PanelSettings } from "./types";
import { migratePanelConfig, validatePanelConfig } from "./validate";

export const BACKUP_APP = "panel" as const;
export const BACKUP_FORMAT_VERSION = 1 as const;
export const MAX_BACKUP_FILE_SIZE = 5 * 1024 * 1024;

export type BackupKind = "panel-backup" | "panel-navigation";

interface BackupEnvelopeBase {
    app: typeof BACKUP_APP;
    formatVersion: typeof BACKUP_FORMAT_VERSION;
    exportedAt: string;
}

export interface FullBackupFile extends BackupEnvelopeBase {
    kind: "panel-backup";
    data: PanelConfig;
}

export interface NavigationBackupData {
    schemaVersion: PanelConfig["schemaVersion"];
    categories: PanelCategory[];
}

export interface NavigationBackupFile extends BackupEnvelopeBase {
    kind: "panel-navigation";
    data: NavigationBackupData;
}

export interface BackupPreview {
    fileName: string;
    exportedAt: string;
    categoryCount: number;
    linkCount: number;
    scope: "full" | "navigation";
}

export interface ImportFailure {
    ok: false;
    message: string;
    details: string[];
}

export type FullImportResult =
    | { ok: true; preview: BackupPreview; config: PanelConfig }
    | ImportFailure;

export type NavigationImportResult =
    | { ok: true; preview: BackupPreview; categories: PanelCategory[] }
    | ImportFailure;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const failure = (message: string, details: string[] = []): ImportFailure => ({
    ok: false,
    message,
    details,
});

export const createFullBackup = (
    config: PanelConfig,
    exportedAt = new Date().toISOString(),
): FullBackupFile => ({
    app: BACKUP_APP,
    kind: "panel-backup",
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt,
    data: clonePanelConfig(config),
});

export const createNavigationBackup = (
    config: PanelConfig,
    exportedAt = new Date().toISOString(),
): NavigationBackupFile => ({
    app: BACKUP_APP,
    kind: "panel-navigation",
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt,
    data: {
        schemaVersion: config.schemaVersion,
        categories: clonePanelConfig(config.categories),
    },
});

export const serializeBackup = (
    backup: FullBackupFile | NavigationBackupFile,
): string => JSON.stringify(backup, null, 2);

export const buildBackupFilename = (
    kind: BackupKind,
    date = new Date(),
): string => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return kind === "panel-backup"
        ? `panel-backup-${stamp}.json`
        : `panel-navigation-${stamp}.json`;
};

export const downloadJsonFile = (filename: string, content: string): void => {
    const blob = new Blob([content], {
        type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);

    try {
        anchor.click();
    } finally {
        anchor.remove();
        // 给浏览器留出读取 Blob 的时间，再释放 URL。
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
};

const readJsonFile = async (
    file: File,
): Promise<{ ok: true; value: unknown; fileName: string } | ImportFailure> => {
    const fileName = file.name || "未命名文件";
    const mime = (file.type || "").toLowerCase();
    const hasJsonName = /\.json$/i.test(fileName);
    const hasJsonMime = mime.includes("json");

    if (!hasJsonName && !hasJsonMime) {
        return failure("请选择 JSON 文件", [
            `文件类型不受支持：${mime || "未知"}`,
        ]);
    }

    if (file.size === 0) {
        return failure("文件为空，无法导入");
    }

    if (file.size > MAX_BACKUP_FILE_SIZE) {
        return failure("文件超过 5MB 限制", [
            `当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB`,
        ]);
    }

    let text: string;
    try {
        text = await file.text();
    } catch (error) {
        return failure("读取文件失败", [
            error instanceof Error ? error.message : String(error),
        ]);
    }

    if (!text.trim()) {
        return failure("文件内容为空，无法导入");
    }

    try {
        return {
            ok: true,
            value: JSON.parse(text.replace(/^﻿/, "")),
            fileName,
        };
    } catch (error) {
        return failure("JSON 解析失败", [
            error instanceof Error ? error.message : String(error),
        ]);
    }
};

interface EnvelopeResult {
    ok: true;
    data: Record<string, unknown>;
    exportedAt: string;
}

const validateEnvelope = (
    parsed: unknown,
    expectedKind: BackupKind,
): EnvelopeResult | ImportFailure => {
    if (!isRecord(parsed)) {
        return failure("备份文件必须是一个 JSON 对象");
    }

    if (parsed.app !== BACKUP_APP) {
        return failure("不是 Panel 备份文件", ["app 字段必须为 panel"]);
    }

    if (parsed.kind !== expectedKind) {
        if (parsed.kind === "panel-backup" || parsed.kind === "panel-navigation") {
            const label =
                parsed.kind === "panel-backup"
                    ? "全部配置"
                    : "导航配置";
            return failure(`这是${label}备份，请使用对应的导入按钮`);
        }

        return failure("备份类型不受支持", [
            `kind 字段无效：${String(parsed.kind)}`,
        ]);
    }

    if (parsed.formatVersion !== BACKUP_FORMAT_VERSION) {
        if (
            typeof parsed.formatVersion === "number" &&
            parsed.formatVersion > BACKUP_FORMAT_VERSION
        ) {
            return failure("备份版本过新，当前版本无法导入");
        }

        return failure("不支持的备份版本", [
            `formatVersion：${String(parsed.formatVersion)}`,
        ]);
    }

    if (!isRecord(parsed.data)) {
        return failure("备份缺少 data 对象");
    }

    const exportedAt =
        typeof parsed.exportedAt === "string" &&
        !Number.isNaN(Date.parse(parsed.exportedAt))
            ? parsed.exportedAt
            : "未知";

    return {
        ok: true,
        data: parsed.data,
        exportedAt,
    };
};

const buildPreview = (
    fileName: string,
    exportedAt: string,
    config: PanelConfig,
    scope: BackupPreview["scope"],
): BackupPreview => ({
    fileName,
    exportedAt,
    categoryCount: config.categories.length,
    linkCount: config.categories.reduce(
        (total, category) => total + category.links.length,
        0,
    ),
    scope,
});

export const readFullBackup = async (file: File): Promise<FullImportResult> => {
    const parsed = await readJsonFile(file);
    if (!parsed.ok) return parsed;

    const envelope = validateEnvelope(parsed.value, "panel-backup");
    if (!envelope.ok) return envelope;

    if (!isRecord(envelope.data.settings)) {
        return failure("备份缺少个性化设置", [
            "全部配置备份必须包含 data.settings",
        ]);
    }

    const validation = validatePanelConfig(
        migratePanelConfig(envelope.data),
    );
    if (!validation.ok) {
        return failure("配置数据校验失败", validation.errors);
    }

    return {
        ok: true,
        preview: buildPreview(
            parsed.fileName,
            envelope.exportedAt,
            validation.value,
            "full",
        ),
        config: validation.value,
    };
};

export const readNavigationBackup = async (
    file: File,
    currentSettings: PanelSettings,
): Promise<NavigationImportResult> => {
    const parsed = await readJsonFile(file);
    if (!parsed.ok) return parsed;

    const envelope = validateEnvelope(parsed.value, "panel-navigation");
    if (!envelope.ok) return envelope;

    if (!Array.isArray(envelope.data.categories)) {
        return failure("导航备份缺少 categories 数组");
    }

    // 使用当前设置作为校验上下文；导入时只替换 categories，不会应用这些设置。
    const candidate: Record<string, unknown> = {
        schemaVersion: envelope.data.schemaVersion,
        categories: envelope.data.categories,
        settings: currentSettings,
    };

    const validation = validatePanelConfig(migratePanelConfig(candidate));
    if (!validation.ok) {
        return failure("导航数据校验失败", validation.errors);
    }

    return {
        ok: true,
        preview: buildPreview(
            parsed.fileName,
            envelope.exportedAt,
            validation.value,
            "navigation",
        ),
        categories: validation.value.categories,
    };
};
