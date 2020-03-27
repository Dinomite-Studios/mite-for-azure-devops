import "./Settings.scss";
import React = require("react");
import { IProjectSettingsHubContentState, defaultProjectSettingsHubContentState } from "./Settings.Props";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IExtensionDataManager, IExtensionDataService, IProjectPageService } from "azure-devops-extension-api";
import { MiteClient } from "mite-api-ts";
import { miteApiUserAgent, miteAccountNameSettingKey, miteApiKeySettingKey, miteProjectIdSettingKey, miteServiceIdSettingKey } from "../../Common";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Dropdown } from "azure-devops-ui/Dropdown";

export class ProjectSettingsContent extends React.Component<{}, IProjectSettingsHubContentState> {

    private projectIds: IListBoxItem<string>[] = [];
    private serviceIds: IListBoxItem<string>[] = [];
    private projectIdSelection = new DropdownSelection();
    private serviceIdSelection = new DropdownSelection();
    private readonly noSelectionItem: IListBoxItem<string> = {
        id: '-1',
        text: 'No Selection'
    };

    private projectService?: IProjectPageService;
    private settingsManager?: IExtensionDataManager;
    private miteClient?: MiteClient;

    constructor(props: {}) {
        super(props);
        this.state = defaultProjectSettingsHubContentState;
    }

    public async componentDidMount() {
        await SDK.init({ loaded: false });
        await this.initializeState();
    }

    private async initializeState(): Promise<void> {
        const accessToken = await SDK.getAccessToken();
        this.projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const settingsService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
        this.settingsManager = await settingsService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

        // We start out with the default state and then
        // modify it if setting have already been changed.
        let initialState = defaultProjectSettingsHubContentState;
        this.projectIds.push(this.noSelectionItem);
        this.serviceIds.push(this.noSelectionItem);

        const project = await this.projectService.getProject();
        if (project) {
            initialState.projectId = project.id;
            initialState.projectName = project.name;

            const savedProjectId = await this.settingsManager.getValue<string>(this.getProjectIdSettingKey(project.id), { scopeType: 'User', defaultValue: '-1' });
            initialState.savedSettings.defaultMiteProjectId = +savedProjectId;
            const savedServiceId = await this.settingsManager.getValue<string>(this.getServiceIdSettingKey(project.id), { scopeType: 'User', defaultValue: '-1' });
            initialState.savedSettings.defaultMiteServiceId = +savedServiceId;
        }

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
        initialState.authValid = initialState.savedSettings.miteAccountName !== '' && initialState.savedSettings.miteApiKey !== '';
        if (initialState.authValid) {
            this.miteClient = new MiteClient(miteApiUserAgent, initialState.savedSettings.miteAccountName, initialState.savedSettings.miteApiKey);
            initialState.authValid = await this.miteClient.isAuthorized();

            if (initialState.authValid) {
                const selectedProjectIndex = await this.initializeProjects(initialState);
                const selectedServiceIndex = await this.initializeServices(initialState);
                this.projectIdSelection.select(selectedProjectIndex);
                this.serviceIdSelection.select(selectedServiceIndex);

                initialState.ready = true;
            }
        } else {
            initialState.ready = false;
        }

        await SDK.notifyLoadSucceeded();
        await SDK.ready();

        this.setState(initialState);
    }

    public render(): JSX.Element {
        const currentState = this.state;

        return (
            <Page className="settings-hub flex-grow">
                <Header title="Project"
                    description={currentState.projectName ? currentState.projectName : ''}
                    titleSize={TitleSize.Medium} />

                <div className="page-content page-content-top rhythm-horizontal-16">
                    <div>
                        {!currentState.authValid && <p className="auth-invalid-warning">Invalid authentication credentials. Please check your general settings and verify
                        the mite connection is setup correctly.</p>}

                        <p className="setting-label">Default mite project</p>
                        <p className="setting-description">
                            You can assign a mite project here that's related to this Azure DevOps project. That way created
                            time entries will reference the respective mite project properly. If you leave this setting empty,
                            time entries will not have a mite project assigned by default.
                            </p>

                        <div className="flex-row">
                            <Dropdown
                                className="setting-dropdown"
                                placeholder="Select a mite Project"
                                items={this.projectIds}
                                disabled={!currentState.ready || !currentState.authValid}
                                selection={this.projectIdSelection}
                                onSelect={this.onSelectProjectId}
                            />
                        </div>

                        <div className="spacer" />

                        <p className="setting-label">Default mite service</p>
                        <p className="setting-description">
                            You can assign a mite service here that should be used when creating new time entries. If you leave this setting empty,
                            no service will be assigned to created time entries by default.
                        </p>

                        <div className="flex-row">
                            <Dropdown
                                className="setting-dropdown"
                                placeholder="Select a mite Service"
                                items={this.serviceIds}
                                disabled={!currentState.ready || !currentState.authValid}
                                selection={this.serviceIdSelection}
                                onSelect={this.onSelectServiceId}
                            />
                        </div>
                    </div>
                </div>
            </Page>);
    }

    private async initializeProjects(state: IProjectSettingsHubContentState): Promise<number> {
        let index = 0;
        const projects = await this.miteClient!.getActiveProjects();

        for (let i = 0; i < projects.length; i++) {
            const p = projects[i];
            this.projectIds.push({ id: p.id.toString(), text: p.name });

            if (p.id === state.savedSettings.defaultMiteProjectId) {
                // Need to account for the "No Selection" item,
                // hence increase the actual index by one.
                index = i + 1;
            }
        }

        return index;
    }

    private async initializeServices(state: IProjectSettingsHubContentState): Promise<number> {
        let index = 0;
        const services = await this.miteClient!.getActiveServices();

        for (let i = 0; i < services.length; i++) {
            const s = services[i];
            this.serviceIds.push({ id: s.id.toString(), text: s.name });

            if (s.id === state.savedSettings.defaultMiteServiceId) {
                // Need to account for the "No Selection" item,
                // hence increase the actual index by one.
                index = i + 1;
            }
        }

        return index;
    }

    private getProjectIdSettingKey(projectId: string): string {
        return `${miteProjectIdSettingKey}-${projectId}`;
    }

    private onSelectProjectId = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<string>) => {
        const newProjectId = +item.id;
        this.saveProjectId(newProjectId);
    };

    private onSelectServiceId = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<string>) => {
        const newServiceId = +item.id;
        this.saveServiceId(newServiceId);
    };

    private async saveProjectId(id: number): Promise<void> {
        await this.settingsManager!.setValue(this.getProjectIdSettingKey(this.state.projectId!), id, { scopeType: 'User' });
    }

    private async saveServiceId(id: number): Promise<void> {
        await this.settingsManager!.setValue(this.getServiceIdSettingKey(this.state.projectId!), id, { scopeType: 'User' });
    }

    private getServiceIdSettingKey(projectId: string): string {
        return `${miteServiceIdSettingKey}-${projectId}`;
    }
}