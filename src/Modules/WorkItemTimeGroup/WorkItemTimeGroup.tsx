import "./WorkItemTimeGroup.scss";

import {
    IWorkItemChangedArgs,
    IWorkItemFieldChangedArgs,
    IWorkItemFormService,
    IWorkItemLoadedArgs,
    WorkItemTrackingServiceIds
} from "azure-devops-extension-api/WorkItemTracking";

import { CommonServiceIds, IExtensionDataService, IProjectPageService, IExtensionDataManager } from "azure-devops-extension-api";
import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { showRootComponent, miteApiKeySettingKey, miteAccountNameSettingKey, miteApiUserAgent, miteProjectIdSettingKey, miteServiceIdSettingKey } from "../../Common";
import { Button } from "azure-devops-ui/Button";
import { IWorkItemTimeGruopContentState, defaultWorkItemTimeGroupContentState } from "./WorkItemTimeGroup.Props";
import { IMiteExtensionSettings } from "../Settings/Settings.Props";
import { MiteClient, MiteTimeEntry, MiteCreateTimeEntryArgs } from "mite-api-ts";
import { WorkItemTimeGroupUtilities } from "./WorkItemTimeGroup.Utilities";

class WorkItemTimeGroupContent extends React.Component<{}, IWorkItemTimeGruopContentState> {

    private miteClient?: MiteClient;
    private workItemFormService?: IWorkItemFormService;
    private projectService?: IProjectPageService;
    private settingsManager?: IExtensionDataManager;

    constructor(props: {}) {
        super(props);
        this.state = defaultWorkItemTimeGroupContentState;
    }

    public async componentDidMount() {
        await SDK.init({ loaded: false }).then(() => {
            this.registerEvents();
        });

        await this.initializeState();
    }

    private async initializeState(): Promise<void> {
        let initializedState = defaultWorkItemTimeGroupContentState;
        this.projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const settings = await this.initializeSettings();

        // Only if we have valid mite extension settings for authorization
        // we can continue initializing the work item time group.
        if (settings) {
            initializedState.hasValidSettings = true;
            initializedState.settings = settings;

            this.miteClient = new MiteClient(miteApiUserAgent, settings.miteAccountName, settings.miteApiKey);
            this.workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);

            // Double check the settings are valid here by testing
            // whether we are authorized with the mite API.
            initializedState.hasValidSettings = await this.miteClient!.isAuthorized();

            // If still valid, we can now check if this work item is currently being tracked.
            if (initializedState.hasValidSettings) {
                const workItemId = await this.workItemFormService!.getId();
                const trackingTimeEntry = await this.getTimeEntryForTodayForWorkItem(workItemId);

                if (trackingTimeEntry) {
                    initializedState.trackingTimeEntry = trackingTimeEntry;
                    initializedState.isTracking = await this.isWorkItemCurrentlyTracking(workItemId);
                }
            }
        }

        await SDK.notifyLoadSucceeded();
        await SDK.ready();

        initializedState.ready = true;
        this.setState(initializedState);
    }

    public render(): JSX.Element {
        const currentState = this.state;

        if (currentState.hasValidSettings) {
            return this.renderTrackingControls(currentState);
        } else if (currentState.ready) {
            return this.renderInvalidSettings();
        } else {
            return (<div />);
        }
    }

    private async initializeSettings(): Promise<IMiteExtensionSettings | null> {
        const accessToken = await SDK.getAccessToken();
        const settingsService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
        this.settingsManager = await settingsService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);
        const savedMiteAccountName = await this.settingsManager.getValue<string>(miteAccountNameSettingKey, { scopeType: 'User' });
        const savedMiteApiKey = await this.settingsManager.getValue<string>(miteApiKeySettingKey, { scopeType: 'User' });
        const hasValidAuthorizationSettings = savedMiteApiKey !== '' && savedMiteAccountName !== ''

        if (hasValidAuthorizationSettings) {
            const project = await this.projectService!.getProject();
            const savedProjectId = await this.settingsManager.getValue<string>(this.getProjectIdSettingKey(project!.id), { scopeType: 'User', defaultValue: '-1' });
            const defaultMiteProjectId = +savedProjectId;
            const savedServiceId = await this.settingsManager.getValue<string>(this.getServiceIdSettingKey(project!.id), { scopeType: 'User', defaultValue: '-1' });
            const defaultMiteServiceId = +savedServiceId;

            return {
                miteAccountName: savedMiteAccountName,
                miteApiKey: savedMiteApiKey,
                defaultMiteProjectId: defaultMiteProjectId,
                defaultMiteServiceId: defaultMiteServiceId
            }
        }

        return null;
    }

    private async getTimeEntryForTodayForWorkItem(workItemId: number): Promise<MiteTimeEntry | null> {
        const todaysEntries = await this.miteClient!.getTimeEntriesForToday();
        if (todaysEntries.length > 0) {
            const index = todaysEntries.findIndex(e => e.note.includes(`${workItemId}###`));
            if (index > -1) {
                return todaysEntries[index];
            }
        }

        return null;
    }

    private renderTrackingControls(state: IWorkItemTimeGruopContentState): JSX.Element {
        return (
            <div className="time-group-content">
                <div className="tracking-controls">
                    {!state.isTracking && <Button
                        className="tracking-button"
                        text="Start Tracking"
                        onClick={this.onStartTracking}
                        disabled={!state.ready} />}

                    {state.isTracking && <Button
                        className="tracking-button"
                        text="Stop Tracking"
                        onClick={this.onStopTracking}
                        disabled={!state.ready} />}

                    <div className={state.isTracking ? "minutes-container tracking" : "minutes-container"}>
                        <span>{WorkItemTimeGroupUtilities.prettyPrintMinutes(state.trackingTimeEntry ? state.trackingTimeEntry!.minutes : 0)}</span>
                    </div>
                </div>
            </div>
        );
    }

    private renderInvalidSettings(): JSX.Element {
        return (
            <div className="time-group-content">
                <span>Please verify your mite settings are set correctly.</span>
            </div>
        );
    }

    private registerEvents() {
        SDK.register(SDK.getContributionId(), () => {
            return {
                // Called when the active work item is modified
                onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
                },

                // Called when a new work item is being loaded in the UI
                onLoaded: (args: IWorkItemLoadedArgs) => {
                },

                // Called when the active work item is being unloaded in the UI
                onUnloaded: (args: IWorkItemChangedArgs) => {
                },

                // Called after the work item has been saved
                onSaved: (args: IWorkItemChangedArgs) => {
                },

                // Called when the work item is reset to its unmodified state (undo)
                onReset: (args: IWorkItemChangedArgs) => {
                },

                // Called when the work item has been refreshed from the server
                onRefreshed: (args: IWorkItemChangedArgs) => {
                }
            };
        });
    }

    private async isWorkItemCurrentlyTracking(workItemId: number): Promise<boolean> {
        const trackingTimeEntry = await this.miteClient!.getTrackingTimeEntry();
        if (trackingTimeEntry !== null) {
            return trackingTimeEntry.note.includes(`${workItemId}###`);
        }

        // No tracker active or currently tracking other work item.
        return false;
    }

    private onStartTracking = (): void => {
        this.startTracking();
    }

    private async startTracking(): Promise<void> {
        this.setState({ ready: false });

        // Create a new time entry, if this work item
        // does not have an associated time entry for today yet.
        let timeEntry = this.state.trackingTimeEntry;
        let newTimeEntry: MiteTimeEntry | null;
        if (!this.state.trackingTimeEntry) {
            const workItemId = await this.workItemFormService!.getId();
            const workItemTitle = await this.workItemFormService!.getFieldValue('Title');

            let payload: MiteCreateTimeEntryArgs = {
                time_entry: {
                    note: `${workItemId}### ${workItemTitle}`
                }
            };

            if (this.state.settings!.defaultMiteProjectId !== -1) {
                payload.time_entry.project_id = this.state.settings!.defaultMiteProjectId;
            }

            if (this.state.settings!.defaultMiteServiceId !== -1) {
                payload.time_entry.service_id = this.state.settings!.defaultMiteServiceId;
            }

            newTimeEntry = await this.miteClient!.createTimeEntry(payload);

            if (newTimeEntry) {
                timeEntry = newTimeEntry;
            }
        }

        // If the time entry was created successfully or already
        // exists, we can start tracking it.
        if (timeEntry) {
            const tracker = await this.miteClient!.startTracker(timeEntry!.id);

            this.setState({
                hasValidSettings: true,
                isTracking: tracker !== null,
                trackingTimeEntry: timeEntry,
                ready: true
            });
        }

        // Failed.
        // TODO: Display some error indication.
        this.setState({ ready: true });
    }

    private onStopTracking = (): void => {
        this.stopTracking();
    }

    private async stopTracking(): Promise<void> {
        this.setState({ ready: false });
        await this.miteClient!.stopTracker(this.state.trackingTimeEntry!.id);
        this.setState({ ready: true, isTracking: false });
    }

    private getProjectIdSettingKey(projectId: string): string {
        return `${miteProjectIdSettingKey}-${projectId}`;
    }

    private getServiceIdSettingKey(projectId: string): string {
        return `${miteServiceIdSettingKey}-${projectId}`;
    }
}

showRootComponent(<WorkItemTimeGroupContent />);