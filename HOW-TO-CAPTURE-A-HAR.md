---
title: "How to capture a HAR file — a plain-language guide"
description: "A HAR file is a recording of every conversation your browser had with a website. This explains what one is, how to capture a useful one in Chrome, Edge, Firefox or Safari, the single setting most people miss, how to check what is inside before you share it, and how to redact it safely. Written for someone who has never opened a browser's developer tools."
canonical: https://persephonepunch.github.io/crm-sync-setup/how-to-capture-a-har.html
category: "Setup"
date: 2026-09-07
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/HOW-TO-CAPTURE-A-HAR.md
licence: CC-BY-4.0
tags:
  - security
  - theme
---
# How to capture a HAR file

Written for someone who has never opened a browser's developer tools. No prior knowledge assumed,
and nothing here requires a developer.

## What a HAR file actually is

When you open a web page, your browser has a long series of short conversations with servers. It
asks for the page, then for the images, the fonts, the prices, the stock levels, the analytics, the
chat widget. Each of those is a request, and each comes back with a response.

**A HAR file is a recording of all of those conversations, in order, with timestamps.** The name
stands for HTTP Archive. It is an ordinary text file in JSON format, and you can open it in any
text editor.

The reason it is useful is that it records what the server **actually sent**, which is not always
what the page **showed you**. A page can receive a price and choose not to display it. It can
receive a whole customer record and show one name. The screen shows the decision; the HAR shows the
material that decision was made from.

## When you would want one

- Auditing what a website really sends and receives — for example with the
  [HAR permissions audit prompt](https://persephonepunch.github.io/crm-sync-setup/HAR-PERMISSIONS-AUDIT.md).
- Proving the order things happened in. Timestamps settle arguments that screenshots cannot: did
  the tracking fire before or after the cookie banner was answered?
- Giving a support team evidence of a problem that only happens for you.
- Checking what personal data leaves a page, and to whom.

## Before you record

Two minutes of preparation makes the difference between a file that answers a question and one that
does not.

- **Use a private or incognito window.** It starts with no cookies and no cache, so the recording
  shows a first visit rather than a half-remembered one.
- **Use a test account, not a real customer's.** Whatever you do while recording is in the file.
- **Know what you are going to do before you start**, so the recording is short. A wandering
  twenty-minute session produces a huge file and no clearer answer.

---

## Capturing one

The menus differ slightly by browser and version, but every browser follows the same four steps:
open the developer tools, go to the Network tab, do the thing, then save.

### Chrome or Edge

1. Open the site in a new incognito or InPrivate window.
2. Press **F12**. On a Mac, **Cmd + Option + I**. A panel opens at the side or bottom.
3. Click the **Network** tab along the top of that panel.
4. Tick **Preserve log**. This keeps the recording going when the page navigates — without it, the
   record is wiped every time you click a link, and you will end up with only the last page.
5. Tick **Disable cache** if it is offered.
6. Now do the journey you want recorded.
7. **Right-click anywhere in the list of requests** and choose the save option that mentions
   **content**. Chrome offers more than one: pick the one that includes response content, not the
   sanitised or redacted export. Recent versions may warn you that the file contains sensitive
   information — that warning is correct, and the next section is about handling it.

### Firefox

1. Open the site in a new private window.
2. Press **F12**, then click the **Network** tab.
3. Turn on the setting to persist logs (in the network panel's settings, usually a gear icon).
4. Do the journey.
5. Right-click in the request list and choose **Save All As HAR**.

### Safari

1. Turn the developer tools on first — they are hidden by default. **Safari → Settings →
   Advanced**, then tick the option to show features for web developers.
2. Open a private window, then **Develop → Show Web Inspector**, and click **Network**.
3. Do the journey.
4. Use the export button in the network panel — usually an arrow icon near the top of the list.

---

## The setting most people miss

**Response content.** Some export options save only the *headers* — the envelope of each
conversation, not the letter inside. That file will tell you which addresses were contacted and
when, and nothing about what came back.

If the question you are asking is "what did the server actually send", you need the export that
includes response bodies. In Chrome that is the option mentioning content; in others it is usually
the default.

A quick way to tell afterwards: open the file in a text editor and search for `"text"`. If you find
long blocks of page or data content, you have bodies. If you only find short entries and lots of
`"headers"`, you do not.

## What to record for a storefront audit

Short and deliberate beats long and thorough. Five or six steps:

1. Land on the home page.
2. Open a product page.
3. Add the item to the basket.
4. Open the basket.
5. Sign in as a test customer, and open the account page.
6. Stop before you enter payment details.

That covers the interesting surfaces — catalogue, basket, identity, account — in under a minute of
recording, and produces a file small enough to work with.

---

## Treat the file as a password

This is the part to read twice. **A HAR file usually contains live credentials.** Your session
cookie is in there. Any tokens the site used are in there. So is any personal data that crossed the
wire while you were recording — an email address you typed, an order you opened, an address on an
account page.

Anyone who has the file can, in many cases, act as you.

**Before you share it with anyone, including an AI assistant:**

1. **Open it in a text editor** and search for these words, one at a time:
   `Authorization`, `Cookie`, `token`, `key`, `secret`, `password`, `email`, and your own email
   address.
2. **Replace the values you find**, not the labels. Keep `"name": "Authorization"` and change the
   value to `REDACTED`, so the audit can still see that a header was present without seeing what it
   contained.
3. **Save it under a new name** so you do not confuse the redacted copy with the original.
4. **Delete the original** when you are finished with it.
5. **Sign out of the test account afterwards**, and if anything credential-shaped appeared in the
   file, treat it as disclosed and have it rotated.

If any of that feels beyond you, that is a reasonable thing to hand to a developer — and it is a
five-minute job for them, not a project.

## Common problems

| What you see | What happened |
|---|---|
| The file is nearly empty | Recording was not running, or the panel was opened after the page loaded. Open the tools first, then reload |
| Only the last page is in it | "Preserve log" was off. Turn it on and record again |
| No response content anywhere | The export left bodies out. Use the option that includes content |
| The file is enormous | The session was too long, or a video or large images loaded. Clear the log immediately before the journey and keep it to a few steps |
| Nothing appears when you click | Some panels have a filter set to one type of request. Clear the filter, or select "All" |

## What a HAR cannot tell you

Worth knowing before you draw conclusions from one.

It records **one session, by one person, on one device, in one market, at one moment**. It cannot
show you what a different customer would have been sent, what happens on a phone in another
country, or what the site does at three in the morning when nobody is browsing.

In particular it cannot show anything that happens with no page open — a scheduled job, a data
deletion running in the background, or an automated purchase made by software. Those leave no
browser trace at all, and need a different kind of evidence.

---

**Next:** [the HAR permissions audit prompt](https://persephonepunch.github.io/crm-sync-setup/HAR-PERMISSIONS-AUDIT.md)
— hand it, and your redacted capture, to any AI assistant.
