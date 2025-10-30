![MIS Arcade Logo](https://i.imgur.com/Ksh7kxp.png)

# MIS Arcade Gaming Platform 🎮

A digital gaming platform where event attendees can play interactive games, compete on leaderboards, and earn tickets for prizes.

![MIS Arcade Home](https://i.imgur.com/xfun9rH.jpeg)

## What It Is

MIS Arcade, as a project, was designed for an in-person college event to garner attention for the Management Information Systems (MIS) student club. MIS Arcade is a web-based gaming platform designed for event engagement and entertainment. Think of it as a virtual arcade in your browser where every game session matters, and every high score could win you real prizes.

## Key Features

### 🎯 **Player Authentication**
- Attendees log in with their email address or student (registration) number
- One active session per user to ensure fair play
- Automatic session tracking to prevent multiple simultaneous logins
- Optional verification system for controlled access (useful for beta testing or exclusive events)
- Games can fetch user's avatar from the TurboWarp namespace to display in-game

### 🪙 **Tokens System**
- Players start with a set amount of tokens to play games
- Each game session deducts tokens automatically
- Low token warnings keep players informed
- Staff/Unlimited Play Mode where special users can be granted unlimited play without token deduction (no awards)

### 🎫 **Ticket Rewards**
- Win tickets by playing games and achieving high scores
- Ticket balances are tracked and updated in real-time
- Redeem tickets for prizes at the event booth
- **Note**: Unlimited play mode users do not earn tickets (primarily for staff testing)

![Leaderboard](https://i.imgur.com/xMoupEF.jpeg)

### 🏆 **Leaderboards**
- Competitive rankings for each game
- See top players across all games
- View your standing against other attendees
- Real-time score submission and updates

### 🎨 **Arcade Experience**
- Retro-inspired neon theme with vibrant colors
- Animated background effects creating an immersive atmosphere
- Responsive design that works on desktop, tablet, and mobile
- Game credits and "How to Play" guides for each game

### Unlimited Mode
- Unlimited tokens for free play
- No tickets awarded in this mode
- Suited for staff plays and testing
- Displays ∞ in place of token count

### Library Games
Currently featuring games such as:
- Sky Hop
- Juice Jitsu
- Velocity Dash

Each game includes:
- Code gallery showing development
- Credits (developers and licenses)
- How-to-play guide
- Dedicated leaderboard

![Login screen](https://i.imgur.com/VLvjwt5.png)

## Technical Architecture

- Vue.js 3
- TypeScript
- PocketBase backend
- Vite
- TurboWarp HTML packaged Scratch games (quick to ship and Creative Commons licensed)
- Optimized for Cloudflare Pages

![Tech Stack](https://i.imgur.com/3wxEABL.png)

## How It Works

### 1. **Login Process**
Attendees enter their email or registration number. The system validates registration and shows a confirmation with name and avatar. If the server is unavailable, attendees can continue as guests (no tickets awarded).

### 2. **Game Selection**
Browse the game library. Each game shows a preview and description. Clicking a game opens it with controls and instructions.

### 3. **Playing Games**
Games run in a protected iframe for security. The system tracks:
- Token usage (if not in unlimited play mode)
- High scores
- Play duration
- Ticket awards (standard players only)

### 4. **Score Submission**
At session end, the best score is submitted to the leaderboard. Scores are tracked per game and user.

### 5. **Ticket Awards**
- Animated notification showing amount won
- Sound effect
- Balance update
- Real-time sync across devices

**Unlimited Play Mode**: Staff and authorized users with unlimited play enabled can play without tokens and do not earn tickets.

### 6. **Leaderboard Updates**
High scores appear on leaderboards immediately. Rankings can be viewed per game or across all games.

## Security Features

- **Single Session Enforcement**: Users can only be logged in on one device at a time
- **Session Conflict Detection**: If someone tries to log in while already active, they receive a warning
- **Hard Reload Protection**: Refreshing the page logs users out to prevent session hijacking
- **Token Validation**: Server-side validation ensures tokens can't be manipulated
- **Access Control**: Optional verification system for controlling event access
- **Staff Mode**: Unlimited play for staff members without affecting ticket economy

## Offline & Guest Mode

If the server is unavailable:
- Attendees can still play as guests
- Games function normally
- No tokens deducted
- No tickets awarded
- High scores tracked locally

## User Types

### Standard Players
- Start with tokens
- Tokens deduct per game
- Earn tickets
- Compete on leaderboards

### Staff / Unlimited Play Users
- Unlimited play without tokens
- No tickets awarded
- Can test all games
- High scores still count on leaderboards

### Guest Users
- Play when server is down
- No token/ticket tracking
- No prizes
- Local score tracking

![Game View](https://i.imgur.com/RqnhqrB.jpeg)

## Visual Highlights

### Top Navigation Bar
- Player name and avatar
- Live token count (or ∞ for unlimited play)
- Ticket balance
- Logout

### Visual Feedback
- Token deduction animations
- Low-token warnings
- Out-of-tokens state
- Ticket wins with sound and visuals

### Arcade Aesthetics
- Animated floating particles
- Pulsing grid lines
- Neon borders
- Scan line overlays
- Retro colors

## Current Security Gaps

Because it targets a campus-only environment, the setup assumes a private (not publicly accessible) deployment and depends on values provided by the client (e.g., arcadeUserId in localStorage and TurboWarp shared storage), client-side updates to PocketBase fields like tokens/tickets, and a simple GET endpoint for token deductions using a URL token. This works, but it also gives a clear opportunity to harden things: a determined user could swap arcadeUserId, write to the TurboWarp namespace, or replay requests; the game iframe currently allows allow-same-origin allow-scripts, link previews permit popups to escape the sandbox, and any “client secret” in env becomes public once bundled.

## PocketBase Schema

#### mis_users
| Field | Type | Required | Notes |
|---|---|---|---|
| id | text (record id) | yes | primary key |
| email | email | yes | unique |
| firstName | text | no |  |
| lastName | text | no |  |
| avatar | file | no | used to build URL via files.getURL |
| avatarbase64 | text | no | base64 fallback |
| verified | bool | no | gates login when enabled |
| tokens | number | no | remaining tokens |
| tickets | number | no | total earned tickets |
| unlimitedPlay | bool | no | bypass tokens, no ticket awards |
| created | date-time | auto |  |
| updated | date-time | auto |  |

#### sessions
| Field | Type | Required | Notes |
|---|---|---|---|
| id | text (record id) | yes | set to user id |
| user | relation -> mis_users | yes | owner of session |
| last_action | text | yes | last page/url |
| last_seen | date-time | auto | used to detect active session |
| created | date-time | auto |  |
| updated | date-time | auto |  |

#### scores
| Field | Type | Required | Notes |
|---|---|---|---|
| id | text (record id) | yes | primary key |
| user | relation -> mis_users | yes | scorer |
| gamekey | text | yes | game identifier |
| score | number | yes | submitted best-per-run |
| tickets_earned | number | no | tickets for that run |
| created | date-time | auto |  |
| updated | date-time | auto |  |

#### cache
| Field | Type | Required | Notes |
|---|---|---|---|
| id | text (record id) | yes | primary key |
| gamekey | text | yes | cached game key |
| high_scores | JSON array | no | [{ score: number, user: string }] |
| updated | date-time | auto | sort key |
| created | date-time | auto |  |

## Game - Client Communication
### What to use in TurboWarp
- Add TurboWarp’s “Local Storage” extension.
- Set its namespace to exactly: `misarcade`.

### Shared storage location
- The client and your game communicate via a single localStorage key:
```56:71:src/pages/GameView.vue
// TurboWarp unified LocalStorage namespace
const NAMESPACE_KEY = 'extensions.turbowarp.org/local-storage:misarcade'
function readNamespace(): any {
  return parseNamespaceValue(localStorage.getItem(NAMESPACE_KEY))
}
```

### Data contract (keys and meaning)
- All values live under `data` in that namespace. These are the keys the client reads or writes:
```61:127:src/pages/GameView.vue
// tokens: number of tokens (stringified). May be absent; server is source of truth
// tokenstatus: handshake for token deduction ("check" → client processes → "ok")
function getTokens(): number { /* reads data.tokens */ }
function setTokens(next: number) { /* writes data.tokens */ }
function getTokenStatus(): string | undefined { /* reads data.tokenstatus */ }
function setTokenStatus(status: string) { /* writes data.tokenstatus */ }

// ingame: 1 while a run is active, 0 when not
function getIngameStatus(): number { /* reads data.ingame */ }

// score: current run score; client records the max observed while ingame=1
function getScoreFromNamespace(): number | null { /* reads data.score */ }

// ticketsWon: tickets your game says were earned for the last run (non-negative int)
// ticketsUpdate: set to 1 to request award; client processes and resets to 0
// NOTE: client multiplies ticketsWon by 2 when awarding
function getTicketsUpdateFlag(): number { /* reads data.ticketsUpdate */ }
function getTicketsWonAmount(): number { /* reads data.ticketsWon and returns won*2 */ }
function setTicketsUpdateFlag(value: number) { /* writes data.ticketsUpdate */ }

// tickets: user’s total tickets; client updates after award, game can display it
function setNamespaceTickets(nextTotal: number) { /* writes data.tickets */ }
```

- On login, the client seeds user visuals and tickets for your game to read:
```150:169:src/pages/Login.vue
// Seeds into data: tickets, avatar64, avatarURL
obj.data.tickets = String(p)
obj.data.avatar64 = avatar64
obj.data.avatarURL = avatarURL
```

### When the client reacts
```248:254:src/pages/GameView.vue
function handleStorage(e: StorageEvent) {
  if (e.key !== NAMESPACE_KEY) return
  // reacts to tokenstatus, score, ingame, ticketsUpdate
}
```

### Typical TurboWarp game flow

- Token check (optional gate):
  - At “Press Start” or before a run, set `tokenstatus` to `"check"`.
  - Wait until `tokenstatus` becomes `"ok"` before enabling the run.
  - In guest mode or no tokens, the client still sets `"ok"` but will not award tickets.

- Start a run:
  - Set `ingame` to `1`.
  - Set `score` to `0` (or your start value).

- During the run:
  - Update `score` as the player progresses (number or string-convertible number).
  - Do not submit scores yourself; the client tracks and later submits the best score seen while `ingame=1`.

- End a run:
  - Set `ingame` to `0`.
  - If tickets should be awarded, set `ticketsWon` to the raw amount your game earned and then set `ticketsUpdate` to `1`.
    - The client will:
      - Immediately reset `ticketsUpdate` to `0`.
      - Award tickets to the user (skipped in unlimited/guest).
      - Multiply `ticketsWon` by 2 when adding to the user total.
      - Persist the new total to backend and write `data.tickets`.
      - Play the win toast and sound.

- Displaying user info:
  - Read `tickets` to show the user’s current total.
  - Read `avatarURL` (prefer) or `avatar64` to display avatar.

- Score submission behavior:
  - The client automatically submits the maximum `score` observed between `ingame = 1` and the next `ingame = 0` for the current game.
  - You only need to maintain `score` and toggle `ingame`.

### TurboWarp block mappings

- Namespace: set to `misarcade`.
- Keys:
  - `tokenstatus`: set to text `"check"`, poll until equals `"ok"`.
  - `ingame`: set to text `"1"` or `"0"`.
  - `score`: set to a number (or text of a number).
  - `ticketsWon`: set to text of a non-negative integer.
  - `ticketsUpdate`: set to text `"1"` to request award; client resets to `"0"`.
  - `tickets`: read-only for display.

Minimal example timeline in blocks (pseudo):
- On green flag: set `ingame` → `"0"`, set `score` → `"0"`.
- On “Start”:
  - set `tokenstatus` → `"check"`.
  - repeat until `tokenstatus` = `"ok"`.
  - set `ingame` → `"1"`.
- During play: update `score`.
- On game over:
  - set `ingame` → `"0"`.
  - set `ticketsWon` → "<your tickets>".
  - set `ticketsUpdate` → `"1"`.

### For HTML/JS games (same origin)
```javascript
const KEY = 'extensions.turbowarp.org/local-storage:misarcade';
const nowSec = Math.floor(Date.now()/1000);
const obj = JSON.parse(localStorage.getItem(KEY) || '{}');
obj.data = obj.data || {};

// start run
obj.data.ingame = '1';
obj.data.score = 0;
obj.time = nowSec;
localStorage.setItem(KEY, JSON.stringify(obj));

// update score
const upd = JSON.parse(localStorage.getItem(KEY) || '{}');
upd.data = upd.data || {};
upd.data.score = (upd.data.score || 0) + 1;
upd.time = Math.floor(Date.now()/1000);
localStorage.setItem(KEY, JSON.stringify(upd));

// end + award
const end = JSON.parse(localStorage.getItem(KEY) || '{}');
end.data = end.data || {};
end.data.ingame = '0';
end.data.ticketsWon = String(3); // raw amount; client doubles when awarding
end.data.ticketsUpdate = '1';
end.time = Math.floor(Date.now()/1000);
localStorage.setItem(KEY, JSON.stringify(end));
```

### Notes
- tickets multiplier: client awards `ticketsWon * 2`. Provide the base amount; don’t pre-double it.
- Guest/unlimited: games still run; ticket awards are skipped. High scores still submit.
- Types: values are stored as strings; numbers are accepted if JSON-serializable. The client is tolerant and coerces where needed.
- Acknowledgements:
  - `tokenstatus`: client sets to `"ok"`.
  - `ticketsUpdate`: client resets to `"0"` after processing.

## Create a Registration Page That Works With MIS Arcade Client

This guide shows how to build a simple registration page on your own site that is fully compatible with the MIS Arcade client. The client uses PocketBase and reads user info from the `mis_users` collection. Your registration page should create records in that collection with the fields below.

### What the client expects

- **Collection**: `mis_users`
- **Required fields**
  - **email**: string, unique
  - **firstName**: string
  - **lastName**: string
- **Recommended fields**
  - **avatar**: file (image) — used for fast URL-based avatars
  - **avatarbase64**: string (Data URL) — fallback avatar used in games
  - **tickets**: number (default 0)
  - **verified**: boolean (default false; required if `requireVerified` is enabled in the client)
- The client derives:
  - **displayName** = `firstName + " " + lastName`
  - **avatarURL** from `avatar` file
  - **avatar64** from `avatarbase64`
- The client logs in by looking up `email`. If a user enters a student number matching `^2\\d+$`, the client converts it to an email by appending `@myasm.ca`.

### Registration page requirements

- Collect these inputs:
  - First name
  - Last name
  - Email (or Student Number; convert to email on your backend if you support that)
  - Avatar (optional upload)
- Create a `mis_users` record with the fields above.
- If your event requires verified users, set `verified: true` on approval (email/SMS/manual).
- Initialize `tickets` to `0` unless you grant a starting balance.

Notes:
- Keep `avatarbase64` under your PocketBase text size limits. A small PNG or JPEG at mobile-friendly size is ideal.
- Either `avatar` or `avatarbase64` is enough for avatars; both is best for performance and compatibility.
  
### Minimal backend flow

1) Validate inputs
- Ensure `email` is valid and unique.
- If supporting student numbers, convert `studentNumber` to `email` (e.g., `2XXXXXXXX → 2XXXXXXXX@myasm.ca`) before saving.

2) Store avatar
- If user uploads a file: send it as `avatar` in a multipart request.
- If you want a guaranteed fallback for games, also store a Data URL in `avatarbase64`.

3) Create the user record
- Set `verified` according to your onboarding rules.

4) Return success

### What the Arcade client will do after login

- Looks up the user by `email` (or derived email from student number).
- Stores:
  - `arcadeUserId`, `arcadeUserName`
  - `arcadeUserAvatarBase64`, `arcadeUserAvatarURL`
- Populates TurboWarp namespace storage with `tickets`, `avatar64`, and `avatarURL`.

### Quick checklist

- mis_users collection exists with fields above
- Registration page writes a record with required fields
- Optional: verification flow sets `verified=true`
- Optional: avatar file and/or base64 stored

- Ensures compatibility with:
  - Login by email or student number
  - Profile display (name and avatar)
  - Leaderboards (name + avatar shown)
  - In‑game avatars and ticket syncing

# 🌟 Support
If you find this project helpful, please consider:

Giving it a star ⭐
[Buying me a coffee](https://buymeacoffee.com/uzayyildirim)
