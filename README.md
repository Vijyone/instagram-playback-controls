# Instagram Embed Playback Controls

Adds a seek bar, play/pause, playback speed, back five seconds, mute and volume controls to Instagram videos embedded in other pages, including Content Studio.

[Download the Chrome / Edge ZIP](https://github.com/Vijyone/instagram-playback-controls/releases/latest/download/Instagram-Playback-Controls-Chrome-Edge.zip)

## Install on each PC

1. Download the ZIP above and extract it to a folder you will keep.
2. In Chrome, open `chrome://extensions`. In Edge, open `edge://extensions`.
3. Enable **Developer mode** and select **Load unpacked**.
4. Select the extracted **instagram-embed-controls** folder containing `manifest.json`.
5. Reload the page containing the Instagram video. For Content Studio, select **Instagram embed** in the review room.

Use the same package on Windows, macOS or Linux with desktop Chrome or Edge. This is an unpacked extension, not a Chrome Web Store installation; keep its extracted folder in place. If you download this repository's source ZIP instead, select its extracted root folder containing `manifest.json`.

## Updates

This GitHub release does **not** auto-update. To update, download a newer release, replace the files in the same extracted folder, and click **Reload** on its card in `chrome://extensions`. Chrome Web Store publication and automatic updates are not set up yet.

The current release draws its controls **inside the Instagram embed**. It is not yet the proposed connector for controls drawn by Content Studio itself.

## Scope

The extension runs only on `https://www.instagram.com/*/embed/*`, including embedded frames. It operates on the existing video element. The manifest requests no cookies, storage, browsing-history, native messaging or additional host permissions. It contains no API keys, account credentials or workspace data.

It handles Instagram embeds and can coexist with the original Video Control for Instagram extension. The Content Studio Live player has separate built-in controls. This extension cannot make unavailable Instagram videos playable or grant access to a private Site.

## Verification

The release preserves the existing extension runtime and manifest unchanged. Packaging checks verify the manifest, script references, narrow embed match and archive contents. A local browser fixture confirmed that the toolbar renders and that playback, speed and mute respond. Seeking and back-five-seconds were not conclusively verified. This was a script fixture, not a test of an installed extension against a live Instagram embed. Instagram availability varies by reel and browser session.

## Source and license

Companion adaptation of [Arcus92/instagram-video-control](https://github.com/Arcus92/instagram-video-control), by David Schulte, under the [MIT license](LICENSE). The companion TypeScript source is included in `source/embed.ts`; the browser runs `js/embed.js`.
