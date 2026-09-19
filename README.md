# Stack Kitchen

| Field | Value |
|---|---|
| **Status** | LIVE |
| **Viewport** | responsive, desktop-first |
| **Last playtest** | 2026-09-16 (4) — KEEP GOING (deploy để bạn bè test chung) |
| **Live build** | https://nghuylychee.github.io/stack-kitchen/ |

Status is one of: `BUILDING` · `PLAYTEST` · `LIVE` · `PAUSED`.

Card game 2–4 người kiểu mạt chược: bốc, giữ, đánh và tố thẻ nguyên liệu để ráp
món Việt. Ai đủ Appetizer + Main + Dessert trước thì kết thúc ván, điểm cao nhất
thắng.

Tốt nghiệp từ slot `007-kitchen-mahjong` của NGH-AI-GAME-STUDIO — xem
`ADR-004-graduate-007-standalone-repo.md` bên repo studio.

## Chế độ chơi

| Chế độ | Mô tả |
|---|---|
| **Play vs Bots** | 1 người vs 1–3 bot, gameplay y như prototype |
| **Online room** | Tạo phòng → gửi mã 5 ký tự hoặc link `?room=CODE`. 2–4 ghế, ghế trống do bot ngồi. Rớt mạng → bot đánh thay, nhập lại mã để lấy lại ghế |

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # ra dist/
```

Deploy: push lên `main` → GitHub Actions build và đẩy lên GitHub Pages
(`.github/workflows/deploy.yml`). Cần bật **Settings → Pages → Source: GitHub Actions**.

## Kiến trúc

```text
src/
├── core/data.ts     số liệu + 27 thẻ + 20 món (design/01–05)
├── core/rules.ts    hàm luật thuần
├── core/match.ts    Match — host-authoritative: chạy luật, bot, nhịp event, cửa sổ tố, giới hạn lượt
├── core/types.ts    View (state đã che) · HostEvent · Intent
├── ai/bot.ts        bot (design/05-ai-player.md)
├── net/room.ts      RoomHost / RoomClient trên PeerJS
├── ui/table.ts      bàn chơi: phát event theo hàng đợi, animation, kéo thả → Intent
└── main.ts          Home · Lobby · Table
```

- Chế độ bot và online dùng **cùng một** `Match`. Offline: host và client nằm chung trang.
- Client không bao giờ nhận bài người khác hay thứ tự pool.
- P2P: host thoát là phòng đóng. Host về lý thuyết có thể gian lận — chấp nhận cho chơi với bạn bè.

## Tài liệu

`design/` — `00-core.md` … `06-online-room.md`, `ui/table.md`, `art.md`.
`design/reference-prototype.html` — bản prototype gốc, giữ làm tham chiếu gameplay.
