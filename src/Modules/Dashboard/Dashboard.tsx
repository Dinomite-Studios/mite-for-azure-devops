import "./Dashboard.scss";

import { CommonServiceIds, IHostPageLayoutService, IExtensionDataManager, IExtensionDataService } from "azure-devops-extension-api";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Page } from "azure-devops-ui/Page";
import { showRootComponent } from "../../Common";

import { IDashboardHubContentState } from "./Dashboard.Props";

class DashboardContent extends React.Component<{}, IDashboardHubContentState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            fullScreenMode: false,
            ready: false
        };
    }

    public componentDidMount() {
        SDK.init();
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        const layoutService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        const fullScreenMode = await layoutService.getFullScreenMode();

        this.setState({
            fullScreenMode: fullScreenMode,
            ready: true,
            extensionContext: SDK.getExtensionContext()
        })
    }

    public render(): JSX.Element {
        const currentState = this.state;

        return (
            <Page className="flex-grow">
                <Header title="Dashboard"
                    commandBarItems={this.getCommandBarItems()}
                    description={currentState.extensionContext ? `mite for Azure DevOps v${currentState.extensionContext.version}` : 'Extension version not available'}
                    titleSize={TitleSize.Medium} />

                <div className="page-content page-content-top rhythm-horizontal-16">
                    <div>Dashboard is coming soon...</div>
                </div>
            </Page>
        );
    }

    //#region Page Command Bar

    private getCommandBarItems(): IHeaderCommandBarItem[] {
        return [
            {
                id: "fullScreen",
                ariaLabel: this.state.fullScreenMode ? "Exit full screen mode" : "Enter full screen mode",
                iconProps: {
                    iconName: this.state.fullScreenMode ? "BackToWindow" : "FullScreen"
                },
                onActivate: () => { this.onToggleFullScreenMode() }
            }
        ];
    }

    private async onToggleFullScreenMode(): Promise<void> {
        const fullScreenMode = !this.state.fullScreenMode;
        this.setState({ fullScreenMode });

        const layoutService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        layoutService.setFullScreenMode(fullScreenMode);
    }

    //#endregion Page Command Bar
}

showRootComponent(<DashboardContent />);