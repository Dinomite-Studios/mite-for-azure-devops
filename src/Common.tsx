import "azure-devops-ui/Core/override.css";
import "es6-promise/auto";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./Common.scss";

export function showRootComponent(component: React.ReactElement<any>) {
    ReactDOM.render(component, document.getElementById("root"));
}

export const miteApiUserAgent = 'dinomite.azure.devops.extension';
export const miteAccountNameSettingKey = 'mite-account-name';
export const miteApiKeySettingKey = 'mite-api-user-key';
export const miteProjectIdSettingKey = 'mite-project-id';
export const miteServiceIdSettingKey = 'mite-service-id';