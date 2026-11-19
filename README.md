# Campus Find — University Lost & Found Portal

A responsive lost-and-found portal built with plain HTML, CSS, and vanilla JavaScript. User accounts, posts, claim requests, and the current session are stored in the browser's `localStorage`; no server or package manager is required.

## Features

- Student registration and login, plus a seeded administrator account.
- Lost/found posts with optional image uploads (stored as Base64, maximum 1 MB) and moderator approval.
- Public browsing with live search, category/type/date/location filters, and newest/oldest sorting.
- Interactive campus map pins with live lost/found counts and direct location filtering.
- Item detail pages with owner-excluding, duplicate-protected claim requests.
- Student dashboard for posts, claims, and received claim proofs.
- Admin tools for post and claim decisions, user listings, and post moderation.
- Shared responsive footer with a daily safety tip, returned-item counter, collection details, and back-to-top control.
- Rules and FAQs covering posting, claims, verification, and collection.
- Responsive layouts, accessible labels, status badges, confirmation prompts, and toast notifications.
- Eight sample approved posts across multiple campus places are added on the first browser visit.

## Folder structure

```text
lost-and-found/
├── index.html
├── items.html
├── post-item.html
├── item-details.html
├── login.html
├── my-dashboard.html
├── admin.html
├── faq.html
├── css/
│   ├── style.css
│   └── pages.css
├── js/
│   ├── locations.js
│   ├── storage.js
│   ├── auth.js
│   ├── items.js
│   ├── claims.js
│   ├── admin.js
│   └── main.js
└── images/
```

## How to run

Open `index.html` directly in a modern browser, or open this folder in VS Code and use Live Server. Data belongs to the browser profile and origin in which the site is opened. Clearing site data removes the demo accounts and posts; reloading then seeds them again.

## Demo administrator login

- Email: `admin@uni.edu`
- Password: `admin123`

This is a front-end demonstration, not production authentication: passwords and all portal data are stored locally in the browser and are not protected from inspection or modification.

Footer collection hours can be edited in `FOOTER_CONFIG` at the top of `js/main.js`; project credits are configured in `PROJECT_CREDITS`.

## Team

- Shamim Ahmed
- Shaifuzzaman Ratul
- Sayed Asadur Rahman

## Locations

The shared DIU campus place catalog lives in `js/locations.js`. It groups the locations under Academic Buildings, Offices & Services, Food, Residential Halls, Outdoor & Recreation, Gates & Transport, and Others. Each place has a stable ID and editable percentage coordinates (`x`, `y`) for the optional `images/campus-map.png` background. Library and Mosque are marked unverified until their exact names and locations can be confirmed.

Lost posts can select up to three catalog places; Found posts select one place and where the item is currently kept. Existing free-text locations are migrated to a matching catalog place when possible, or to “Not sure” when they cannot be matched. Browse filters and map pins use these IDs, so place labels can be edited without breaking stored posts.

## Responsive design

The layout is mobile-first and supports 320px phones through 1920px+ monitors. Breakpoints are 640px (tablet/small screens), 900px (desktop navigation and wider layouts), and 1200px (large-screen containers and the two-column home hero). Item grids auto-fit available space, mobile filters collapse behind a button, and wide admin tables scroll within their own container.
