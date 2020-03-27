import * as SDK from "azure-devops-extension-sdk";
import { IListBoxItem } from "azure-devops-ui/ListBox";

export interface IMiteExtensionSettings {

    /**
     * Default mite project ID when creating new time entries.
     */
    defaultMiteProjectId: number;

    /**
     * Default service ID of the mite service assigned to created time entries.
     */
    defaultMiteServiceId: number;

    /**
     * The mite API key to use to authorize requests the user.
     */
    miteApiKey: string;

    /**
     * mite account name of the mite organization owner.
     */
    miteAccountName: string;
}

export const settingsPages: string[] = [
    "General",
    "Project"
]

export interface IGeneralSettingsHubContentState {
    savedSettings: IMiteExtensionSettings;
    modifiedSettings: IMiteExtensionSettings;
    connectionTestFailed: boolean,
    connectionTestSucceeded: boolean,
    extensionContext?: SDK.IExtensionContext;
    ready: boolean;
}

export interface IProjectSettingsHubContentState {
    savedSettings: IMiteExtensionSettings;
    modifiedSettings: IMiteExtensionSettings;
    projectId: string;
    projectName: string;
    authValid: boolean;
    ready: boolean;
}

export const defaultProjectSettingsHubContentState: IProjectSettingsHubContentState = {
    savedSettings: {
        miteAccountName: '',
        miteApiKey: '',
        defaultMiteProjectId: -1,
        defaultMiteServiceId: -1
    },
    modifiedSettings: {
        miteAccountName: '',
        miteApiKey: '',
        defaultMiteProjectId: -1,
        defaultMiteServiceId: -1
    },
    projectId: '',
    projectName: '',
    authValid: false,
    ready: false
}

export const defaultGeneralSettingsHubContentState: IGeneralSettingsHubContentState = {
    savedSettings: {
        miteAccountName: '',
        miteApiKey: '',
        defaultMiteProjectId: -1,
        defaultMiteServiceId: -1
    },
    modifiedSettings: {
        miteAccountName: '',
        miteApiKey: '',
        defaultMiteProjectId: -1,
        defaultMiteServiceId: -1
    },
    connectionTestFailed: false,
    connectionTestSucceeded: false,
    ready: false
}