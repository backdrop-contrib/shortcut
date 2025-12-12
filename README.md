# Shortcut Module

The **Shortcut** module for Backdrop CMS provides a persistent toolbar that lets users manage personalized shortcut links without leaving the current page. Inline AJAX controls make it easy to add links, re-enable disabled items, or temporarily hide shortcuts from view.

## Features

- Displays a sticky toolbar pinned to the top of every page with quick links tailored to each user.
- Lets every user manage independent shortcut sets without a shared configuration screen.
- Inline button toggles allow add, enable, and disable actions without page reloads.
- Color picker support gives each set its own active-toolbar background hue.
- Active-set badge doubles as a hoverable dropdown so users can switch sets instantly, with menu items styled in their respective colors.
- Confirmation dialog prevents accidental disables while keeping the UI steady.
- Respects Backdrop permissions so only authorized users can manage shortcuts.

## Installation

1. Place the `shortcut` directory inside your Backdrop `modules` folder (for example `modules/contrib`).
2. Visit `Admin > Functionality` and enable the **Shortcut** module.
3. Clear caches to ensure the toolbar library (CSS/JS) loads correctly.

## Configuration

There is no central settings page for this module. Each authenticated user configures their own shortcut sets from their account area, including the toolbar highlight color.

1. Assign the **Manage own shortcuts** permission to roles that should maintain their toolbar.
2. Optionally grant **Administer shortcuts** to site managers who need to edit sets for other users.

## Usage

- Open any page while authenticated; the shortcut toolbar appears at the top by default.
- Use the inline manage button next to each shortcut to add a link, re-enable a disabled entry, or disable it after confirmation.
- Hover the active set badge to reveal the set switcher, then pick a different collection without leaving the page.
- Visit `User > Shortcuts` to organize sets, rename collections, pick a toolbar highlight color, or activate a different default set.

## Troubleshooting

- If the toolbar does not appear, verify permissions and clear caches so updated libraries load.
- AJAX actions require valid CSRF tokens; log out and back in if you encounter token errors.
- Theme overrides may hide the toolbar; ensure templates include `page_bottom` or the relevant hooks.

## Maintainers

This module is created and maintained by [Alan Mels](https://github.com/alanmels) of [AltaGrade.com](https://www.altagrade.com). Contributions and issue reports are welcome.

## Credits

Built from the ground up for Backdrop CMS, this project revives the Shortcut experience that core removed as "a feature not used by the majority of websites". By bringing the tool back as a contributed module, it delivers richer controls, per-user customization, and a modernized toolbar that outpaces the original implementation.
