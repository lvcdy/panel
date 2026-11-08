import { showToast } from "../toast";
import {
    buildBackupFilename,
    createFullBackup,
    createNavigationBackup,
    downloadJsonFile,
    readFullBackup,
    readNavigationBackup,
    serializeBackup,
    type ImportFailure,
} from "./backup";
import { openConfirmDialog } from "./confirm";
import {
    getPanelConfig,
    getPanelSettings,
    replaceNavigation,
    replacePanelConfig,
    resetAllSettings,
    resetNavigation,
} from "./store";
import type { StoreFailure } from "./types";

const BUTTON_IDS = [
    "export-all-btn",
    "export-nav-btn",
    "import-all-btn",
    "import-nav-btn",
    "restore-nav-btn",
    "restore-all-btn",
] as const;

let initialized = false;

const getElement = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;

const formatExportedAt = (value: string): string => {
    if (value === "未知") return value;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "未知" : date.toLocaleString("zh-CN");
};

const reportImportFailure = (failure: ImportFailure): void => {
    const first = failure.details[0];
    showToast(
        first ? `${failure.message}：${first}` : failure.message,
        "error",
        6000,
    );

    if (failure.details.length > 0) {
        console.warn("Panel 导入校验失败:", failure.details);
    }
};

const reportStoreFailure = (failure: StoreFailure): void => {
    showToast(failure.message, "error", 6000);

    if (failure.details && failure.details.length > 0) {
        console.warn("Panel 配置写入失败:", failure.details);
    }
};

const setBusy = (busy: boolean): void => {
    BUTTON_IDS.forEach((id) => {
        const button = getElement<HTMLButtonElement>(id);
        if (button) button.disabled = busy;
    });
};

const exportFull = (): void => {
    try {
        const backup = createFullBackup(getPanelConfig());
        downloadJsonFile(
            buildBackupFilename("panel-backup"),
            serializeBackup(backup),
        );
        showToast("完整配置已导出", "success");
    } catch (error) {
        console.error("导出完整配置失败:", error);
        showToast("导出失败，请检查浏览器下载权限", "error");
    }
};

const exportNavigation = (): void => {
    try {
        const backup = createNavigationBackup(getPanelConfig());
        downloadJsonFile(
            buildBackupFilename("panel-navigation"),
            serializeBackup(backup),
        );
        showToast("导航配置已导出", "success");
    } catch (error) {
        console.error("导出导航配置失败:", error);
        showToast("导出失败，请检查浏览器下载权限", "error");
    }
};

const handleFullImport = async (file: File): Promise<void> => {
    setBusy(true);

    try {
        const result = await readFullBackup(file);
        if (!result.ok) {
            reportImportFailure(result);
            return;
        }

        const confirmed = await openConfirmDialog({
            title: "导入全部配置",
            message:
                "导入后将覆盖当前导航数据与个性化设置。\n请确认备份文件来源可靠。",
            details: [
                { label: "文件名称", value: result.preview.fileName },
                {
                    label: "导出时间",
                    value: formatExportedAt(result.preview.exportedAt),
                },
                { label: "分类数量", value: `${result.preview.categoryCount} 个` },
                { label: "网站数量", value: `${result.preview.linkCount} 个` },
                { label: "覆盖范围", value: "导航数据 + 个性化设置" },
            ],
            confirmLabel: "导入并覆盖",
        });

        if (!confirmed) return;

        // 确认时重新读取 Store；replacePanelConfig 会先校验、持久化成功后才提交。
        const current = getPanelConfig();
        console.debug(`Panel 导入前分类数：${current.categories.length}`);

        const replaced = replacePanelConfig(result.config);
        if (!replaced.ok) {
            reportStoreFailure(replaced);
            return;
        }

        showToast("全部配置已导入", "success", 4000);
    } catch (error) {
        console.error("导入全部配置失败:", error);
        showToast("导入失败，请稍后重试", "error");
    } finally {
        setBusy(false);
    }
};

const handleNavigationImport = async (file: File): Promise<void> => {
    setBusy(true);

    try {
        const result = await readNavigationBackup(file, getPanelSettings());
        if (!result.ok) {
            reportImportFailure(result);
            return;
        }

        const confirmed = await openConfirmDialog({
            title: "导入导航配置",
            message:
                "导入后将覆盖当前网站、分类和排序。\n自定义背景、搜索引擎、一言 API 与毛玻璃设置保持不变。",
            details: [
                { label: "文件名称", value: result.preview.fileName },
                {
                    label: "导出时间",
                    value: formatExportedAt(result.preview.exportedAt),
                },
                { label: "分类数量", value: `${result.preview.categoryCount} 个` },
                { label: "网站数量", value: `${result.preview.linkCount} 个` },
                {
                    label: "覆盖范围",
                    value: "仅导航数据（个性化设置保持不变）",
                },
            ],
            confirmLabel: "导入导航",
        });

        if (!confirmed) return;

        // 使用写入时刻 Store 中的最新设置，只替换 categories。
        const current = getPanelConfig();
        console.debug(`Panel 导入前分类数：${current.categories.length}`);

        const replaced = replaceNavigation(result.categories);
        if (!replaced.ok) {
            reportStoreFailure(replaced);
            return;
        }

        showToast("导航配置已导入", "success", 4000);
    } catch (error) {
        console.error("导入导航配置失败:", error);
        showToast("导入失败，请稍后重试", "error");
    } finally {
        setBusy(false);
    }
};

const restoreNavigation = async (): Promise<void> => {
    const confirmed = await openConfirmDialog({
        title: "恢复默认导航",
        message:
            "将恢复 links.ts 中的默认网站、分类和排序，并清除当前新增的网站与分类。\n自定义背景、搜索引擎、一言 API、毛玻璃强度与饱和度都会保留。",
        confirmLabel: "恢复默认导航",
    });

    if (!confirmed) return;

    setBusy(true);
    try {
        const result = resetNavigation();

        if (!result.ok) {
            reportStoreFailure(result);
            return;
        }

        showToast("已恢复默认导航", "success", 4000);
    } finally {
        setBusy(false);
    }
};

const restoreAll = async (): Promise<void> => {
    const confirmed = await openConfirmDialog({
        title: "恢复全部设置",
        message:
            "此操作会清除当前导航和个性化设置，恢复项目初始状态，且无法自动撤销。建议先导出备份。",
        confirmLabel: "恢复全部设置",
        danger: true,
    });

    if (!confirmed) return;

    setBusy(true);
    try {
        const result = resetAllSettings();

        if (!result.ok) {
            reportStoreFailure(result);
            return;
        }

        showToast("已恢复全部设置", "success", 4000);
    } finally {
        setBusy(false);
    }
};

export const initDataPanel = (): void => {
    if (initialized || typeof document === "undefined") return;
    initialized = true;

    const exportAllBtn = getElement<HTMLButtonElement>("export-all-btn");
    const exportNavBtn = getElement<HTMLButtonElement>("export-nav-btn");
    const importAllBtn = getElement<HTMLButtonElement>("import-all-btn");
    const importNavBtn = getElement<HTMLButtonElement>("import-nav-btn");
    const importAllInput = getElement<HTMLInputElement>("import-all-input");
    const importNavInput = getElement<HTMLInputElement>("import-nav-input");
    const restoreNavBtn = getElement<HTMLButtonElement>("restore-nav-btn");
    const restoreAllBtn = getElement<HTMLButtonElement>("restore-all-btn");

    exportAllBtn?.addEventListener("click", exportFull);
    exportNavBtn?.addEventListener("click", exportNavigation);

    importAllBtn?.addEventListener("click", () => {
        if (!importAllInput) return;
        importAllInput.value = "";
        importAllInput.click();
    });

    importNavBtn?.addEventListener("click", () => {
        if (!importNavInput) return;
        importNavInput.value = "";
        importNavInput.click();
    });

    importAllInput?.addEventListener("change", () => {
        const file = importAllInput.files?.[0];
        importAllInput.value = "";
        if (file) void handleFullImport(file);
    });

    importNavInput?.addEventListener("change", () => {
        const file = importNavInput.files?.[0];
        importNavInput.value = "";
        if (file) void handleNavigationImport(file);
    });

    restoreNavBtn?.addEventListener("click", () => {
        void restoreNavigation();
    });

    restoreAllBtn?.addEventListener("click", () => {
        void restoreAll();
    });
};
