import "./Hub.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Page } from "azure-devops-ui/Page";
import { showRootComponent } from "../../Common";

interface IHubContentState {
    fullScreenMode: boolean;
}

class HubContent extends React.Component<{}, IHubContentState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            fullScreenMode: false
        };
    }

    public componentDidMount() {
        SDK.init();
    }

    public render(): JSX.Element {
        return (
            <Page className="flex-grow">
            </Page>
        );
    }
}

showRootComponent(<HubContent />);