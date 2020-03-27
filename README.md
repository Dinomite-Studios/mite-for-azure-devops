# mite for Azure DevOps

This extension for the Azure DevOps platform adds time tracking integration using the tool [mite](https://www.mite.yo.lk) to an organization. It's main purpose is to track time spent on work items during an agile software development process.

## How to get started

Install the extension to your organization from the [Azure DevOps Marketplace](tbd).

## Development

The extension has several modules, which you can find in the `src\Modules` directory. Some of the common code is located in `src` directly.

### Hub 

This module adds the mite Hub Group to navigation menu found at the leftmost screen edge in Azure DevOps.

### Dasboard

This module adds the Dashboard Hub to the mite Hub Group and defines its functionality.

### Settings

This module defines the settings Hub and it's subpages.

### WorkItemTimeGroup

This module extends the work item form by adding a mite form group to it.


