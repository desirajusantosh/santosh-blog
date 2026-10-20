---
title: "20,000 Photos, One Headshot: Curating My Photo Library with Claude Code"
weight: 1
resources:
params:
date: 2026-10-19T10:00:00-07:00
showDate: false
draft: false
tags: ["blog"]
---

### 20,000 Photos, One Headshot: Curating My Photo Library with Claude Code
This blog needed two things: a better headshot than me in a cap and sunglasses, and more photos for the [Wallpapers](../../projects/wallpapers/) page. Somewhere in ten years of photos there had to be good candidates. The problem is that "somewhere" was 15 Google Takeout zip files, an old camera SD card and a backup SSD.

So I asked Claude Code to be my photo critic.

### Round One: The Slow Way
The first Takeout folder had about 1,900 photos. Claude's approach was simple: generate numbered contact sheets (48 thumbnails per image), look at every sheet, shortlist candidates, then check the finalists at full size.

It worked. The picks were genuinely good, with honest notes too: "the power pole on the left edge spoils it", "this is motion-blurred", "he's looking away, so it won't work as a headshot". My own feedback was blunt. Most of the headshot picks were poor, and four of the wallpapers weren't good enough. Claude adjusted, and the second folder went better.

But it was slow, and expensive. Every contact sheet is an image the AI has to look at, and at about 35 sheets per folder, doing all 15 folders that way made no sense.

### Round Two: Do the Boring Part Locally
The fix was obvious once I said it out loud: most photos don't need an AI to look at them. A blurry photo of a parking lot can be rejected by plain math. So Claude built a small local tool (Python, Pillow, OpenCV) that does the first pass on my own laptop:

- **Duplicates:** Takeout puts the same photo in "Photos from 2023" *and* every album it belongs to. Bursts produce ten nearly identical shots. The tool keeps one copy and the sharpest frame of each burst.
- **Junk:** screenshots and downloads (no camera info in the file), receipts and documents (bright, colourless, lots of fine edges), photos that are too dark or blurry.
- **Sorting:** a face detector splits what's left into possible headshots, people and scenes.
- **Ranking:** scenes get scored on sharpness, colour and exposure, and headshots on face size, face sharpness and whether it was shot in portrait mode.

Then it writes just a few contact sheets of the top-ranked photos, and that's all the AI reviews. Ten Takeout folders, about 11,600 new photos, went through in 32 minutes of local processing, and Claude looked at 7 contact sheets instead of 350.

It also built a small review page I can open in the browser: Claude's picks show up with a badge and a one-line note, and I mark my own choices with H, W or P on the keyboard.

### The Bug That Hid 815 Photos
When I pointed the tool at the camera SD card, Claude noticed something odd. Hundreds of the card's filenames already existed in the catalog. Sometimes that was the same photo, but cameras recycle their counters: there can be many different `DSC01234.JPG` files over the years.

The tool had been matching photos by filename only, so it had silently treated **815 different photos** in my Takeout folders as duplicates and never reviewed them. Now it also compares the time each photo was taken: same name, different time means a different photo. A few of the best finds of the whole project came out of that fix, including a fiery sunset I'd forgotten about.

### Can We Go Faster?
My laptop is a 2016 dual-core i7 with integrated graphics, so I asked whether we could parallelize more. Claude measured first: the CPU was only half busy while the disk was saturated. A few tweaks (one worker per CPU thread so they stop fighting each other, a couple of extra workers to hide the slow card reader, and a 16-thread pass for reading timestamps) took it from about 5 photos a second to about 7.

The honest answer was that the hardware is the limit. Decoding JPEG and HEIC files is most of the work, and a GPU wouldn't help much here. But the bigger win was already built in: the tool remembers everything it has seen. When I finally pointed it at the backup SSD, about 30,000 of its 35,500 images turned out to be copies, and the whole scan took under five minutes.

### Is It Local?
The analysis is 100% local. Nothing gets uploaded for processing, and no cloud photo service is involved. The only things that leave my laptop are the handful of shortlist contact sheets Claude looks at, which is the whole point of doing the first pass locally.

### The Results
From roughly 20,000 unique photos:

- **27 new wallpapers** on the renamed [Wallpapers & Screensavers](../../projects/wallpapers/) page: Sedona, Yosemite, Hanging Lake, Haleakalā, Cabo and an aurora over the Bay Area hills. Two got cut after a second look: a near-duplicate of another shot from the same flight, and an old tree silhouette that never really worked.
- **A new headshot.** This took three tries. Claude's favourite was a cherry blossom portrait from Tokyo, sharp and pretty, but I didn't like it once it was live. The one on the homepage now is me at home with Mocha: eye contact, window light and a dog who clearly wants to be in the photo.

The AI was a good critic, but it wasn't the final word, and that's how it should be.

### What's Next
The tool is good enough that I'm thinking about open-sourcing it, mainly for anyone sitting on a pile of Google Takeout zips. Before that it needs better taste: the current scoring thinks a blue sky over a parking lot is a great photo, so a proper aesthetic model is first on the list. More on that soon.
