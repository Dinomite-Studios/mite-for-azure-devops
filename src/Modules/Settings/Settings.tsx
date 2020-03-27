import "./Settings.scss";
import * as React from "react";
import { SingleLayerMasterPanelHeader } from "azure-devops-ui/Components/SingleLayerMasterPanel/SingleLayerMasterPanel";
import { SingleLayerMasterPanel } from "azure-devops-ui/MasterDetails";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { showRootComponent } from "../../Common";
import { IItemProvider, ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Observer } from "azure-devops-ui/Observer";
import { bindSelectionToObservable } from "azure-devops-ui/MasterDetailsContext";
import { IListItemDetails, List, ListItem, ListSelection } from "azure-devops-ui/List";
import { GeneralSettingsHubContent } from './Settings.General'
import { settingsPages } from "./Settings.Props";
import { ProjectSettingsContent } from "./Settings.Project";

const SettingsContent: React.FunctionComponent<{}> = () => {
    const [selection] = React.useState(new ListSelection({ selectOnFocus: false }));
    const [itemProvider] = React.useState(new ArrayItemProvider(settingsPages));
    const [selectedItemObservable] = React.useState(new ObservableValue<string>(settingsPages[0]));

    React.useEffect(() => {
        bindSelectionToObservable(selection, itemProvider, selectedItemObservable);
    });

    return (
        <div className="flex-row">
            <SingleLayerMasterPanel
                renderHeader={renderMasterViewHeader}
                renderContent={() => renderMasterViewContent(selection, itemProvider)}
            />

            <Observer selectedItem={selectedItemObservable}>
                {() => (
                    <div className="flex-grow">
                        {selectedItemObservable.value === 'General' && <GeneralSettingsHubContent />}
                        {selectedItemObservable.value === 'Project' && <ProjectSettingsContent />}
                    </div>
                )}
            </Observer>
        </div>
    );
};

const renderMasterViewHeader = () => {
    return <SingleLayerMasterPanelHeader title="Settings" />;
};

const renderMasterViewContent = (selection: ListSelection, itemProvider: IItemProvider<string>) => {
    return (
        <List
            itemProvider={itemProvider}
            selection={selection}
            renderRow={renderSettingPageListItem}
            width="100%"
            singleClickActivation={true}
        />
    );
};

const renderSettingPageListItem = (index: number, item: string, details: IListItemDetails<string>, key?: string): JSX.Element => {
    return (
        <ListItem
            key={key || "setting-page-list-item-" + index}
            index={index}
            details={details}
        >
            <div className="setting-page-list-item flex-row flex-center h-scroll-hidden">
                <div className="primary-text text-ellipsis">{item}</div>
            </div>
        </ListItem>
    );
};

showRootComponent(<SettingsContent />);