---
title: "Spring Cleaning in October: Speeding Up My Old Windows Laptop with Claude Code"
weight: 1
resources:
params:
date: 2026-10-17T10:00:00-07:00
showDate: false
draft: false
tags: ["blog"]
---

### Spring Cleaning in October: Speeding Up My Old Windows Laptop with Claude Code
My HP Envy x360 has been painfully slow for a while. Startup takes forever, and even regular use feels sluggish. My guess was that something was hogging memory, so I asked Claude Code to take a look before I started randomly killing processes in Task Manager.

My guess turned out to be wrong.

### It Wasn't the Memory
The first thing Claude did was take stock of the machine: an i7-7500U, 16 GB of RAM, Windows 10. Then it looked at what was actually using resources:

- **RAM:** about 8.5 GB of 16 GB free. Chrome and a handful of Windows services were the biggest users, and none of them were doing anything unusual.
- **CPU:** around 7% busy.
- **Disk:** an **HGST 1 TB spinning hard drive**. The disk had 8 requests waiting in line and was taking about 80 ms per read or write, with the laptop basically idle. An SSD takes well under 1 ms.

So nothing was hogging memory. The disk was the bottleneck. At startup Windows, Defender, a dozen updaters and every driver all want the disk at the same time, and a spinning drive can only be in one place at once. Everything just waits its turn.

The checks themselves were plain PowerShell, nothing exotic:

```powershell
Get-PhysicalDisk | Select FriendlyName, MediaType, HealthStatus
Get-Counter '\PhysicalDisk(_Total)\Avg. Disk Queue Length','\PhysicalDisk(_Total)\Avg. Disk sec/Transfer'
Get-CimInstance Win32_Service | Where { $_.StartMode -eq 'Auto' -and $_.PathName -notmatch '\\Windows\\' }
```

That last one turned up the real story: more than 30 third-party services set to start automatically, on a disk that can't handle the load.

### Ten Years of Accumulated Junk
This laptop dates back to 2016, and it has collected about ten years of "I'll just install this one thing". Claude listed every installed program and Store app, then sorted them into three groups: safe to remove, my call, and keep. Some highlights:

- **Two McAfee tools** (the True Key password manager and WebAdvisor) running alongside Windows Defender
- **Two full Microsoft Office installs**, plus the Windows Mail app, quietly syncing a mailbox I check in the browser anyway
- **Java 8 from 2017** and **Firefox 53**, both with years of known security holes
- **A NiceHash crypto miner.** Not running, thankfully, but it had no business being there.
- University leftovers from 2017–18: an exam lockdown browser, a classroom screen-sharing app, an old VPN client, SPSS and Tableau
- HP's preinstalled extras: usage analytics, a "connection optimizer", support helpers and PowerDirector 14, which together ran half a dozen background services
- Adobe Premiere Pro 2020, Media Encoder and Rush, about 7 GB I hadn't opened in years

I picked what went. Claude did the uninstalling, silently where it could. I had to click "Yes" on a lot of admin prompts, but that's the deal.

### Not Everything Went Smoothly
This is where it got interesting, because a lot of uninstallers on a 10-year-old Windows install turned out to be broken.

- **McAfee True Key's uninstaller opened a blank grey window.** Buttons, but no text on any of them. Rather than click blind, Claude downloaded McAfee's official removal tool (MCPR) and checked its digital signature before running it.
- **Every Windows Installer uninstall failed with error 1618** ("another installation is in progress"). It turned out Adobe Reader's auto-updater was in the middle of a failed update and holding the lock. I told Claude to kill it, and everything else went through.
- **HP Support Solutions Framework refused to uninstall** because "HP Support Assistant requires it". We removed Support Assistant, and it *still* refused. Claude dug through the installer log and found the check was reading a stale registry value left behind by an old version. Once that was cleared, the uninstaller hit a second error: it needed one of its own files, which was already gone. At that point Claude suggested just disabling its services. It's still listed in Apps, but it doesn't run.
- **Adobe's uninstaller wanted me to sign in to Creative Cloud** just to remove an app. No thanks. Adobe's own Creative Cloud Cleaner Tool did the job instead.

The pattern that worked: try the silent uninstall, read the log when it fails, use the vendor's official cleanup tool if one exists, and when the uninstaller itself is broken, settle for turning off the parts that slow things down.

### The Final Tally
Over one long day:

- About **40 programs** and **16 Store apps** removed
- **20-plus background services** gone or disabled, including all of the Adobe, HP and McAfee updaters
- Roughly **15–20 GB** of disk space freed up
- A proper restart for the first time in **51 days**. With Windows' "Fast Startup", Shut down doesn't actually reset anything, so only Restart gives you a clean slate.

I kept the things I actually use: dev tools, browsers, Zoom, Spotify, KeePass and TurboTax (it's not April yet, but still).

### Undo Button
Nearly everything here can be brought back. Store apps reinstall from the Microsoft Store, Office from office.com, and the disabled services are only disabled, not deleted:

```powershell
Set-Service AdobeARMservice -StartupType Automatic
Get-ScheduledTask 'Adobe Acrobat Update Task' | Enable-ScheduledTask
```

Claude also backed up the one registry key it removed before deleting it.

### Looking Back
Startup is noticeably quicker, and the laptop isn't fighting itself the moment it boots. But the honest answer is that the cleanup only removed the extra load. Eight minutes after a fresh restart, the hard drive still had about 9 requests waiting in line, all from plain Windows housekeeping like search indexing and Defender. That's what a spinning disk does.

The real fix costs about $60: a 1 TB SATA SSD. The RAM, CPU and even the battery (still at full design capacity, surprisingly) are fine. The disk is the one part holding this laptop back.

Next up? Ordering that SSD.
