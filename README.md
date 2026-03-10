# ZTE Signal Monitor

A browser bookmarklet that transforms your ZTE modem's web interface into a real-time LTE signal monitoring dashboard with band locking capabilities.

![Version](https://img.shields.io/badge/version-6.0-6366f1)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Real-time Signal Monitoring** — RSRP, RSRQ, RSSI, SINR values updated every 1.5 seconds with color-coded quality indicators
- **Band Locking** — Lock your modem to specific LTE bands (B1, B3, B7, B20, etc.) to optimize signal quality. Tries 3 different API methods for maximum compatibility
- **Carrier Aggregation Display** — Shows PCell and SCell bands with bandwidth info
- **Cell Information** — eNB ID, Cell ID, band, bandwidth, network mode (LTE / LTE-A)
- **DNS Configuration** — Change DNS servers directly from the dashboard
- **Interactive Tooltips** — Hover over any label to see what it means and what the ideal ranges are
- **Active Band Highlighting** — Currently connected bands are highlighted in green in the band lock panel
- **Dark Theme UI** — Clean, modern dark interface with JetBrains Mono and DM Sans fonts

## Tested Devices

| Device | Firmware | Band Lock | Notes |
|--------|----------|-----------|-------|
| ZTE MF286R | Turkcell | ✅ | Tested with B1, B3, B7 |

> Should work with most ZTE LTE routers using the `/goform/` API (MF286, MF286D, MF286R, MC888, MF79U, etc.)

## Installation

### Option 1: Bookmark (Recommended)

1. Create a new bookmark in your browser
2. Set the name to **ZTE Signal Monitor**
3. Paste the contents of `zte-monitor-bookmarklet.txt` as the URL
4. Navigate to your modem's web interface (usually `http://192.168.0.1` or `http://192.168.1.1`)
5. **Log in first**, then click the bookmark

### Option 2: Browser Console

1. Navigate to your modem's web interface and log in
2. Open browser console (F12 → Console)
3. Paste the contents of `zte-monitor-bookmarklet.txt` and press Enter

> **Note:** Some browsers strip the `javascript:` prefix when pasting into the address bar. If this happens, use the bookmark method or console method instead.

## Signal Quality Reference

### RSRP (Reference Signal Received Power)
| Range | Quality | Color |
|-------|---------|-------|
| > -80 dBm | Excellent | 🟢 Green |
| -80 to -90 dBm | Good | 🟡 Yellow |
| -90 to -100 dBm | Fair | 🟠 Orange |
| < -100 dBm | Poor | 🔴 Red |

### RSRQ (Reference Signal Received Quality)
| Range | Quality | Color |
|-------|---------|-------|
| > -10 dB | Excellent | 🟢 Green |
| -10 to -12 dB | Good | 🟡 Yellow |
| -12 to -15 dB | Fair | 🟠 Orange |
| < -15 dB | Poor | 🔴 Red |

### SINR (Signal to Interference + Noise Ratio)
| Range | Quality | Color |
|-------|---------|-------|
| > 20 dB | Excellent | 🟢 Green |
| 13 to 20 dB | Good | 🟡 Yellow |
| 0 to 13 dB | Fair | 🟠 Orange |
| < 0 dB | Poor | 🔴 Red |

> **SINR is the most critical value for actual throughput.** A strong RSRP with negative SINR means high interference — changing bands often helps more than improving signal strength.

## Band Locking

The band lock feature tries 3 API methods sequentially for compatibility:

1. `GET` + `SET_LTE_BAND_LOCK`
2. `POST` + `SET_LTE_BAND_LOCK` + auth token
3. `POST` + `SET_NETWORK_BAND_LOCK` + auth token

### Tips for Band Selection

- **Test each band individually** and compare SINR values
- Higher bands (B7: 2600MHz) are often less congested
- Lower bands (B20: 800MHz) have better building penetration
- Enable **B3+B7** together for Carrier Aggregation with good balance
- If a band shows different eNB ID, you're connecting to a different tower

## Files

| File | Description |
|------|-------------|
| `zte-monitor.js` | Full readable source code |
| `zte-monitor-bookmarklet.txt` | Minified bookmarklet (paste as bookmark URL) |

## Security Improvements

This project was inspired by various ZTE bookmarklet scripts. Key improvements:

- **XSS Protection** — All modem data escaped via `textContent`
- **Input Validation** — IPv4 format validation for DNS settings
- **No Global Scope Pollution** — IIFE with `"use strict"`
- **No Inline Event Handlers** — Uses `addEventListener`
- **No Tracking / Ads** — Clean, no third-party links

## License

MIT
