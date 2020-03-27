import * as SDK from "azure-devops-extension-sdk";

export interface IDashboardHubContentState {
    fullScreenMode: boolean;
    ready: boolean;
    extensionContext?: SDK.IExtensionContext;
}