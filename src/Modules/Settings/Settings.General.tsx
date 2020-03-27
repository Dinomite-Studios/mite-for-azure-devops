import "./Settings.scss";
import * as React from "react";
import { defaultGeneralSettingsHubContentState, IGeneralSettingsHubContentState } from "./Settings.Props";
import { Page } from "azure-devops-ui/Page";
import { CommonServiceIds, IExtensionDataManager, IExtensionDataService } from "azure-devops-extension-api";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { miteAccountNameSettingKey, miteApiKeySettingKey, miteApiUserAgent } from "../../Common";
import { TextField } from "azure-devops-ui/TextField";
import { Button } from "azure-devops-ui/Button";
import { MiteClient } from "mite-api-ts";
import * as SDK from "azure-devops-extension-sdk";

export class GeneralSettingsHubContent extends React.Component<{}, IGeneralSettingsHubContentState> {

    private settingsManager?: IExtensionDataManager;
    private miteClient?: MiteClient;

    constructor(props: {}) {
        super(props);

        this.state = defaultGeneralSettingsHubContentState;
    }

    public async componentDidMount() {
        await SDK.init({ loaded: false });
        await this.initializeState();
    }

    private async initializeState(): Promise<void> {
        const accessToken = await SDK.getAccessToken();
        const settingsService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
        this.settingsManager = await settingsService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

        // We start out with the default state and then
        // modify it if setting have already been changed.
        let initialState = defaultGeneralSettingsHubContentState;
        initialState.extensionContext = SDK.getExtensionContext();

        initialState.savedSettings.miteAccountName = await this.settingsManager.getValue<string>(miteAccountNameSettingKey, { scopeType: 'User' });
        initialState.savedSettings.miteApiKey = await this.settingsManager.getValue<string>(miteApiKeySettingKey, { scopeType: 'User' });

        // Create a copy of the saved settings for modification.
        initialState.modifiedSettings = {
            miteApiKey: initialState.savedSettings.miteApiKey,
            miteAccountName: initialState.savedSettings.miteAccountName,
            defaultMiteProjectId: initialState.savedSettings.defaultMiteProjectId,
            defaultMiteServiceId: initialState.savedSettings.defaultMiteServiceId
        }

        // If we already have valid auth credentials we can populate
        // the projects and services dropdowns.
        let hasValidAuthSettings = initialState.savedSettings.miteAccountName !== '' && initialState.savedSettings.miteApiKey !== '';
        if (hasValidAuthSettings) {
            this.miteClient = new MiteClient(miteApiUserAgent, initialState.savedSettings.miteAccountName, initialState.savedSettings.miteApiKey);
            hasValidAuthSettings = await this.miteClient.isAuthorized();
        }

        await SDK.notifyLoadSucceeded();
        await SDK.ready();

        initialState.ready = true;
        this.setState(initialState);
    }

    public render(): JSX.Element {
        const currentState = this.state;

        return (
            <Page className="settings-hub flex-grow">
                <Header title="General"
                    description={currentState.extensionContext ? `mite for Azure DevOps v${currentState.extensionContext.version}` : 'Extension version not available'}
                    titleSize={TitleSize.Large} />

                <div className="page-content page-content-top rhythm-horizontal-16">
                    <div>
                        <p className="setting-label">Account Name</p>
                        <p className="setting-description">
                            Enter your mite account name here. You can find your account name in the URL you use to open mite, e.g. <b>https://accountname.mite.yo.lk</b>.
                        </p>

                        <div className="flex-row">
                            <TextField value={currentState.modifiedSettings.miteAccountName}
                                inputType="text"
                                onChange={this.onMiteAccountNameValueChanged}
                                disabled={!currentState.ready} />
                        </div>

                        <div className="spacer" />

                        <p className="setting-label">API Key</p>
                        <p className="setting-description">
                            In order for the mite extension to function properly and make requests against the mite API your personal mite API key is required. Open
                        mite and navigate to the <b>My user</b> menu. Set <b>Allow API access</b> and then select <b>Display API key</b> to get your personal key
                        displayed. Copy it into the setting below and save.
                        </p>

                        <div className="flex-row">
                            <TextField value={currentState.modifiedSettings.miteApiKey}
                                inputType="password"
                                onChange={this.onMiteApiKeyValueChanged}
                                disabled={!currentState.ready} />
                        </div>

                        <div className="spacer" />

                        <p className="setting-description">
                            Save your changes and verify the connection works and the extension is authorized to make requests on your behalf.
                        </p>

                        <div className="flex-row">
                            <Button
                                text="Save"
                                primary={true}
                                onClick={this.onSaveSettings}
                                disabled={!currentState.ready || (currentState.modifiedSettings.miteApiKey === currentState.savedSettings.miteApiKey && currentState.modifiedSettings.miteAccountName === currentState.savedSettings.miteAccountName)} />
                        </div>

                        <div className="flex-row">
                            <Button
                                className="test-connection-button"
                                text="Test Connection"
                                primary={true}
                                onClick={this.onTestConnection}
                                disabled={!currentState.ready || !currentState.modifiedSettings.miteApiKey || !currentState.modifiedSettings.miteAccountName || currentState.modifiedSettings.miteApiKey !== currentState.savedSettings.miteApiKey || currentState.modifiedSettings.miteAccountName !== currentState.savedSettings.miteAccountName} />
                        </div>

                        {currentState.connectionTestFailed && <p className="connection-failed-hint">Authorization failed!</p>}
                        {currentState.connectionTestSucceeded && <p className="connection-succeeded-hint">Authorization granted!</p>}
                    </div>
                </div>
            </Page>
        );
    }

    private onMiteApiKeyValueChanged = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string): void => {
        const currentState = this.state;

        this.setState({
            modifiedSettings: {
                miteAccountName: currentState.modifiedSettings.miteAccountName,
                miteApiKey: value,
                defaultMiteProjectId: currentState.modifiedSettings.defaultMiteProjectId,
                defaultMiteServiceId: currentState.modifiedSettings.defaultMiteServiceId
            }
        });
    }

    private onMiteAccountNameValueChanged = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, value: string): void => {
        const currentState = this.state;

        this.setState({
            modifiedSettings: {
                miteAccountName: value,
                miteApiKey: currentState.modifiedSettings.miteApiKey,
                defaultMiteProjectId: currentState.modifiedSettings.defaultMiteProjectId,
                defaultMiteServiceId: currentState.modifiedSettings.defaultMiteServiceId
            }
        });
    }

    private onTestConnection = (): void => {
        this.testConnection();
    }

    private async testConnection(): Promise<void> {
        const isAuthorized = await this.miteClient!.isAuthorized();
        this.setState({ connectionTestFailed: !isAuthorized, connectionTestSucceeded: isAuthorized });
    }

    private onSaveSettings = (): void => {
        const currentState = this.state;
        if (currentState.modifiedSettings.miteApiKey
            && currentState.modifiedSettings.miteAccountName
            && ((currentState.modifiedSettings.miteApiKey !== currentState.savedSettings.miteApiKey)
                || (currentState.modifiedSettings.miteAccountName !== currentState.savedSettings.miteAccountName))) {
            this.updateSavedSettings(currentState.modifiedSettings.miteAccountName, currentState.modifiedSettings.miteApiKey);
        }
    }

    private async updateSavedSettings(accountName: string, apiKey: string): Promise<void> {
        const currentState = this.state;
        await this.settingsManager!.setValue(miteAccountNameSettingKey, accountName, { scopeType: 'User' });
        await this.settingsManager!.setValue(miteApiKeySettingKey, apiKey, { scopeType: 'User' });
        this.miteClient = new MiteClient(miteApiUserAgent, accountName, apiKey);

        this.setState({
            savedSettings: currentState.modifiedSettings
        });
    }
}
