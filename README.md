# 🎮 PlaySphere — Professional Multi-Game Gaming App (v3.0 Pro)

An authentic, modern, and premium **Multi-Game Gaming Application** with a mobile-first app UI/UX, accurate realistic boards, online room codes & shareable multiplayer links, 3D animations, sound synthesis, and computer AI.

---

## 🌟 What's New in v3.0

### 🎲 1. Real Authentic Ludo Board & 3D Pawns
- **Authentic Vector Board Design**:
  - **4 Solid Corner Yards**: Each yard contains an **inner white rounded box** with **4 circular pawn sockets** styled with player-color rings and drop shadows.
  - **Center Home Diamond**: **4 distinct colored triangles** (Red from left, Green from top, Yellow from right, Blue from bottom) meeting in the center with a golden trophy crest.
  - **Track Pathways & Home Stretch**: Colored home lanes with directional flow and **golden star safe zones**.
- **Real 3D Pawns**:
  - Realistic pawn silhouette: round sphere head, collar, bell-shaped flared base, glossy specular highlight, and soft contact drop shadow.
  - **Movable Pawns**: Glow with an animated golden aura ring and float/bob smoothly to indicate they can be moved.
  - **Zero Alignment Issues**: Rendered with mathematical precision on a 600×600 SVG grid, ensuring pawns sit exactly inside cells or yard sockets without overlapping borders.
- **Full Kill & Capture Rules**:
  - Opponents are vulnerable on all normal pathway cells and starting squares.
  - Safe zones are strictly restricted to the **4 Golden Star Cells** (`[8, 21, 34, 47]`).
  - Landing on an opponent token **kills it**, sends it back to its yard socket (`step = -1`), plays a capture sound effect, displays a battle notification banner, and awards the capturing player an immediate extra turn!
  - Computer AI in Medium and Hard modes actively hunts and prioritizes killing vulnerable opponent pawns.
- **Custom Player Names Across All Games**:
  - Name your players directly in the Game Setup dialog (Player 1, Player 2, Player 3, Player 4).
  - When opening a shareable invite link, guests are greeted with a dedicated **"Join Match" modal** where they can enter their custom player name and choose their avatar.
  - Player names dynamically display on turn banners, player pods, scoreboards, and victory dialogs across Ludo, Tic-Tac-Toe, and Chess!
- **Multi-Color Popup Alert & Confirm Dialog System**:
  - Replaced native browser `alert()` and `confirm()` with custom animated popup modals featuring 5 multi-color themes: **Success (Emerald/Mint)**, **Warning (Amber/Fire)**, **Danger (Crimson/Ruby)**, **Info (Cyber Cyan)**, and **Royal Purple**.
  - Upgraded floating toast notifications with glassmorphism, animated glow borders, and contextual icons.
- **High-Contrast Visible Form Controls & Dropdowns**:
  - Every `<select>` dropdown styled with custom SVG neon chevron arrows, crisp padding, and explicit high-contrast option backgrounds so options are 100% visible on all operating systems and browsers.

---

### 🌐 2. Working Share Links & 6-Character Game Codes
- **Host / Create Room**:
  - Generates a unique 6-character room code (e.g. `LUDO-8472`) and a direct copyable link (e.g. `?game=ludo&room=LUDO-8472`).
  - **One-Click Share**: Native Web Share API (`navigator.share`) + WhatsApp direct share.
  - **Lobby Screen**: "Waiting for friend to connect..." with real-time status.
- **Join with Code**:
  - Input box to enter any 6-character code or auto-joins if opened via link.
- **Real-Time Cross-Device / Cross-Tab Sync**:
  - Instant synchronization via `BroadcastChannel` and `localStorage` events (works immediately between tabs, windows, or same network/device), plus optional WebRTC via PeerJS.
  - Real-time synced dice rolls, pawn steps, chess moves, tic-tac-toe marks, and turns!

---

### ❌⭕ 3. Upgraded Neon Cyber Tic-Tac-Toe Arena
- Deep metallic frosted-glass 3×3 grid with glowing neon borders.
- Animated SVG glyphs: electric cyan `X` and sunset rose `O` with laser drop-shadows.
- Laser winning line animation.
- Online duel support with room codes and link sharing.
- Unbeatable Minimax AI mode.

---

### ♟️ 4. Tournament Staunton Chessboard & Real 3D Goties
- **Authentic Staunton Tournament Vectors**:
  - Replaced all simplistic shapes with official, globally recognized **Staunton Cburnett tournament pieces**:
    - **Pawn (प्यादा)**: Proportioned spherical head, flared collar, and weighted pedestal.
    - **Knight (घोड़ा)**: Sculpted horse head with perked ears, mane, muzzle, and eye details.
    - **Bishop (ऊंट)**: Mitre cap with carved cleft slit and jewel finial.
    - **Rook (हाथी)**: Castle battlement with 3 distinct crenels and stone base.
    - **Queen (रानी)**: Regal 5-point coronet with pearls and sweeping gown.
    - **King (राजा)**: Imperial arched crown crested with the Christian cross patonce.
- **Realistic Piece Click & Hover Animations**:
  - **3D Piece Elevation**: Clicking a piece smoothly lifts it up ($Z$-axis elevation) with a realistic contact drop-shadow and glowing cyan selection aura.
  - **Pulsing Legal Move Targets**: Target destination squares display animated emerald pulse dots (`.legal-move::after`).
  - **Capture Impact Flash**: Enemy piece squares pulse with crimson capture rings (`.legal-capture::after`) and explode with an impact puff upon capture.
- **Tournament Features**:
  - Red pulsing aura on the King when in check!
  - Move history notation panel, undo, resign, and Blitz/Rapid/Standard tournament clocks.
  - Online room link & code support for remote duels.

---

### 📖 5. Interactive Piece & Goti Rules Guide (Live Move Simulator)
- **Rules for Every Piece (गोटियों के नियम)**:
  - Accessible via `📖 Piece Rules` on the Chess and Ludo top bars, or directly from the Home screen.
  - Interactive chip selector for **Pawn**, **Knight**, **Bishop**, **Rook**, **Queen**, **King**, and **Ludo Goti**.
  - Includes points value, role, English and Hindi names, step-by-step movement rules, capture rules, and Grandmaster strategy tips.
- **Live Interactive Move Simulator**:
  - 5×5 interactive board that shows the exact movement vectors and captures for each selected goti.
  - `▶️ Play Move Animation` button that animates the piece stepping, hopping, or sliding in real time with procedural sound effects!
  - Users can click any square on the simulator to watch the piece glide to that tile.

---

## 🚀 How to Launch
Open [`index.html`](file:///c:/Users/91821/.gemini/antigravity/scratch/all_rahat_project/UI-UX%20Degine/app-game/index.html) in any modern browser (Chrome, Edge, Firefox, Safari) or run it using any live server.
