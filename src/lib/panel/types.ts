export const PANEL_SCHEMA_VERSION = 1 as const;
export const PANEL_CONFIG_STORAGE_KEY = "panel-config" as const;

export type ThemeMode = "dark";

export interface GlassSettings {
    blur: number;
    saturate: number;
}

export interface PanelCustomSearchEngine {
    name: string;
    url: string;
    placeholder: string;
}

export interface PanelSettings {
    glass: GlassSettings;
    backgroundUrl: string;
    hitokotoApi: string;
    customSearchEngine: PanelCustomSearchEngine | null;
    theme: ThemeMode;
}

export interface PanelLink {
    id: string;
    name: string;
    url: string;
    description: string;
    icon: string;
    color: string;
    useIcon?: boolean;
    status?: boolean;
    tags: string[];
    favorite: boolean;
    openInNewTab: boolean;
    visible: boolean;
}

export interface PanelCategory {
    id: string;
    title: string;
    icon?: string;
    visible: boolean;
    links: PanelLink[];
}

export interface PanelConfig {
    schemaVersion: typeof PANEL_SCHEMA_VERSION;
    categories: PanelCategory[];
    settings: PanelSettings;
}

export type StoreErrorCode =
    | "invalid"
    | "storage-unavailable"
    | "quota-exceeded"
    | "storage-error";

export interface StoreFailure {
    ok: false;
    code: StoreErrorCode;
    message: string;
    details?: string[];
}

export interface StoreSuccess<T> {
    ok: true;
    value: T;
}

export type StoreResult<T> = StoreSuccess<T> | StoreFailure;

export interface StoreChange {
    source: "local" | "remote";
    categoriesChanged: boolean;
    settingsChanged: boolean;
}

export type PanelStoreListener = (
    config: PanelConfig,
    change: StoreChange,
) => void;

export type CategoryDeleteMode =
    | { mode: "move"; targetCategoryId: string }
    | { mode: "delete" };

export interface LinkInput {
    name: string;
    url: string;
    description?: string;
    icon?: string;
    color?: string;
    useIcon?: boolean;
    status?: boolean;
    tags?: string[];
    favorite?: boolean;
    openInNewTab?: boolean;
    visible?: boolean;
}

export interface LinkPatch extends Partial<LinkInput> {
    categoryId?: string;
}

export interface CategoryInput {
    title: string;
    icon?: string;
    visible?: boolean;
}

export type CategoryPatch = Partial<CategoryInput>;
