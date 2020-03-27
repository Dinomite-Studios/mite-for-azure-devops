import { MiteTimeEntry } from "mite-api-ts";
import { IMiteExtensionSettings } from "../Settings/Settings.Props";

export interface IWorkItemTimeGruopContentState {

    /**
     * Are the mite settings set correctly and validated?
     */
    hasValidSettings: boolean;

    /**
     * Current extension settings, available if hasValidSettings is true.
     */
    settings?: IMiteExtensionSettings;

    /**
     * Is this work item currently the one with an
     * active mite stopwatch on it?
     */
    isTracking: boolean;

    /**
     * The time entry information for the active work item.
     */
    trackingTimeEntry?: MiteTimeEntry;

    /**
     * Is the control ready for interaction?
     */
    ready: boolean;
}

export const defaultWorkItemTimeGroupContentState: IWorkItemTimeGruopContentState = {
    hasValidSettings: false,
    isTracking: false,
    ready: false
}