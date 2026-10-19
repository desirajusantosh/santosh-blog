---
title: "A Weekend Project: Debloating My Living Room TV with Claude Code"
weight: 1
resources:
params:
date: 2026-10-18T10:00:00-07:00
showDate: false
draft: false
tags: ["blog"]
---

### A Weekend Project: Debloating My Living Room TV with Claude Code
My 2019 Vizio P-Series has been slow for a while. Slow to turn on, slow to open the menu, slow to do pretty much anything. Then I read a Tom's Hardware piece about a developer who pointed Claude Code at their Android TV, let it connect over ADB, and ended up with a TV that ran smoother than when it was new. Disable the junk apps, shorten the animations, swap the launcher, no root needed. That sounded like a good Saturday.

It didn't go quite the way the article did.

### The Vizio Isn't Android
The first thing Claude did was find the TV on my Wi-Fi and ask it what it was. The answer: a P759-G1 running Vizio's SmartCast OS. Not Android. No ADB port, nothing to disable, no launcher to replace.

What SmartCast does have is a local API that the Vizio mobile app uses. You ask the TV to pair, it shows a 4-digit PIN on screen, you send the PIN back, and you get a token. With that, Claude could read the entire settings menu, including a few hidden entries.

Honestly, there wasn't much left to tune. I'd already switched on Quick Start mode myself. The only real change was turning off Viewing Data (Vizio's ACR feature that fingerprints whatever is on screen and sends it home), along with ad tracking and ad replacement. Good for privacy, but it wasn't going to fix the speed.

### The Real Target Was Plugged Into HDMI 4
Here's the thing: I barely use the Vizio's own apps. Everything goes through a Chromecast with Google TV on HDMI 4. That one *is* Android (Android 14, in fact), which put me right back on the article's path.

Getting ADB access took a couple of tries. Developer options on Google TV are hidden until you go to Settings > System > About and click on "Android TV OS build" about seven times. On Android 14 the old `adb connect <ip>:5555` doesn't work either. You have to turn on Wireless debugging, pick "Pair device with pairing code", and pair first:

```bash
adb pair <chromecast-ip>:<pairing-port> <6-digit-code>
adb mdns services          # shows the actual connect port
adb connect <chromecast-ip>:<connect-port>
```

### What Was Actually Wrong
Once Claude was connected, the problem was obvious:

- **Storage:** 90% full, with only 416 MB free on a 4 GB device. This Chromecast is known to crawl when it runs low on space.
- **RAM:** 2 GB total and roughly 500 MB free, with the Google TV home screen alone using about 180 MB of it.
- **Apps:** 23 streaming apps installed. In the history the Chromecast keeps, I'd only actually used about five of them.

### The Cleanup
Claude showed me what it found, and I picked what went. Nothing was rooted, and nothing was removed without me saying yes.

- Uninstalled a couple of apps I'd opened for a few minutes total
- Disabled Google extras I never touch, like Play Movies, Play Games, the feedback app, the print spooler and remote-usage logging. `pm disable-user` keeps them installed, so they can come back
- Set the window, transition and animator animation scales to 0.5x

```bash
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5
adb shell pm disable-user --user 0 com.google.android.videos
```

Free storage went from 416 MB to 734 MB.

### The Launcher Detour
The article's dev installed FLauncher. On my Chromecast the Play Store simply says it isn't available because it was "made for an older version of Android". So I went with Projectivy Launcher instead, which is actively maintained and installs fine on Android 14.

There was one surprise. After Claude set Projectivy as the home app and disabled the Google TV home screen, pressing Home brought up a Google recovery screen instead. That screen is a separate package (`setupwraith`) that steps in when it thinks the launcher is missing. Disabling it too fixed things, and free RAM went from about 518 MB to about 608 MB.

```bash
adb shell cmd package set-home-activity com.spocky.projengmenu/.ui.home.MainActivity
adb shell pm disable-user --user 0 com.google.android.apps.tv.launcherx
adb shell pm disable-user --user 0 com.google.android.tungsten.setupwraith
```

### Fixing the Slow Startup
This was the part that bugged me most, and the fix needed no hacking at all. HDMI-CEC is on, so if I turn things on with the **Chromecast remote**, the TV switches straight to HDMI 4. That skips the Vizio home screen and whatever WatchFree+ channel it wanted to autoplay.

### Undo Button
Everything here is reversible, and Claude kept a log of each change along with the command to undo it. Getting the stock home screen back takes three lines:

```bash
adb shell pm enable com.google.android.tungsten.setupwraith
adb shell pm enable com.google.android.apps.tv.launcherx
adb shell cmd package set-home-activity com.google.android.apps.tv.launcherx/.home.HomeActivity
```

### Looking Back
I started out trying to debloat a TV, and the TV turned out to be the one thing in the setup that couldn't be debloated. If your TV runs its own locked-down OS like Vizio's, the streaming stick plugged into it is probably the thing worth cleaning up. These sticks ship with very little storage, and once that fills up, everything slows down.

The result? It's reasonably quicker now, and it finally has some free space to work with.

Next up? I still have 16 apps I've never opened sitting on there, taking up about 1.3 GB. Probably time to let them go.
