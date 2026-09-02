// ============================================================================
// Project Handlers: Naman Sain & Souvik Mallik
// 
// Maintainers:
// - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
// - Souvik Mallik: Embedded Maintainer
// ============================================================================

import React, { useRef, useEffect } from 'react';


export const EMOTIONS = {
  "happy": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 25,
    "mWidth": 40,
    "extras": []
  },
  "sad": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#4488ff",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -20,
    "mWidth": 40,
    "extras": [
      "tears"
    ]
  },
  "angry": {
    "eShape": "squint",
    "mShape": "curve",
    "eColor": "#ff3300",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -25,
    "mWidth": 40,
    "extras": []
  },
  "surprised": {
    "eShape": "circle",
    "mShape": "o",
    "eColor": "#ffff00",
    "eSize": 1.3,
    "pSize": 0.2,
    "mCurve": 10,
    "mWidth": 15,
    "extras": []
  },
  "neutral": {
    "eShape": "circle",
    "mShape": "line",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  },
  "sleepy": {
    "eShape": "line",
    "mShape": "line",
    "eColor": "#5555ff",
    "eSize": 0.8,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "z"
    ]
  },
  "confused": {
    "eShape": "asym",
    "mShape": "zigzag",
    "eColor": "#cc55ff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "question"
    ]
  },
  "disgusted": {
    "eShape": "squint",
    "mShape": "wavy",
    "eColor": "#88ff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": -10,
    "mWidth": 40,
    "extras": []
  },
  "scared": {
    "eShape": "circle",
    "mShape": "zigzag",
    "eColor": "#ffffff",
    "eSize": 1.2,
    "pSize": 0.1,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "bored": {
    "eShape": "half-closed",
    "mShape": "line",
    "eColor": "#888888",
    "eSize": 0.9,
    "pSize": 0.4,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  },
  "excited": {
    "eShape": "star",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.6,
    "mCurve": 30,
    "mWidth": 50,
    "extras": [
      "sparks"
    ]
  },
  "love": {
    "eShape": "heart",
    "mShape": "curve",
    "eColor": "#ff00aa",
    "eSize": 1.0,
    "pSize": 0.7,
    "mCurve": 20,
    "mWidth": 40,
    "extras": [
      "hearts"
    ]
  },
  "grateful": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.6,
    "mCurve": 15,
    "mWidth": 40,
    "extras": [
      "blush"
    ]
  },
  "proud": {
    "eShape": "arch",
    "mShape": "open-smile",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 20,
    "mWidth": 40,
    "extras": []
  },
  "amused": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#aaff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 25,
    "mWidth": 40,
    "extras": []
  },
  "hopeful": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#00ffff",
    "eSize": 1.1,
    "pSize": 0.6,
    "mCurve": 15,
    "mWidth": 40,
    "extras": [
      "stars"
    ]
  },
  "confident": {
    "eShape": "squint",
    "mShape": "curve",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 15,
    "mWidth": 40,
    "extras": []
  },
  "peaceful": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#aaaaff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 10,
    "mWidth": 40,
    "extras": []
  },
  "cheerful": {
    "eShape": "circle",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 25,
    "mWidth": 40,
    "extras": [
      "blush"
    ]
  },
  "delighted": {
    "eShape": "arch",
    "mShape": "open-smile",
    "eColor": "#ff55aa",
    "eSize": 1.0,
    "pSize": 0.6,
    "mCurve": 30,
    "mWidth": 40,
    "extras": []
  },
  "ecstatic": {
    "eShape": "star",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.2,
    "pSize": 0.7,
    "mCurve": 35,
    "mWidth": 40,
    "extras": [
      "sparks"
    ]
  },
  "blissful": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#ffaaff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 20,
    "mWidth": 40,
    "extras": [
      "blush"
    ]
  },
  "content": {
    "eShape": "half-closed",
    "mShape": "curve",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 15,
    "mWidth": 40,
    "extras": []
  },
  "optimistic": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#aaff00",
    "eSize": 1.1,
    "pSize": 0.6,
    "mCurve": 20,
    "mWidth": 40,
    "extras": []
  },
  "inspired": {
    "eShape": "circle",
    "mShape": "o",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.7,
    "mCurve": 10,
    "mWidth": 20,
    "extras": [
      "bulb"
    ]
  },
  "anxious": {
    "eShape": "circle",
    "mShape": "wavy",
    "eColor": "#ffaa00",
    "eSize": 1.1,
    "pSize": 0.2,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "frustrated": {
    "eShape": "squint",
    "mShape": "zigzag",
    "eColor": "#ff5500",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -10,
    "mWidth": 40,
    "extras": []
  },
  "disappointed": {
    "eShape": "half-closed",
    "mShape": "curve",
    "eColor": "#5588ff",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -15,
    "mWidth": 40,
    "extras": []
  },
  "jealous": {
    "eShape": "squint",
    "mShape": "curve",
    "eColor": "#00ff00",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -10,
    "mWidth": 40,
    "extras": []
  },
  "lonely": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#4444ff",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -15,
    "mWidth": 40,
    "extras": []
  },
  "guilty": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#ffaa55",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "ashamed": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#ff5555",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -15,
    "mWidth": 40,
    "extras": [
      "blush"
    ]
  },
  "heartbroken": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#ff0055",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -25,
    "mWidth": 40,
    "extras": [
      "tears"
    ]
  },
  "devastated": {
    "eShape": "circle",
    "mShape": "open-sad",
    "eColor": "#4444ff",
    "eSize": 1.0,
    "pSize": 0.1,
    "mCurve": -30,
    "mWidth": 40,
    "extras": [
      "tears"
    ]
  },
  "furious": {
    "eShape": "x",
    "mShape": "zigzag",
    "eColor": "#ff0000",
    "eSize": 1.0,
    "pSize": 0.1,
    "mCurve": -20,
    "mWidth": 40,
    "extras": [
      "smoke"
    ]
  },
  "irritated": {
    "eShape": "squint",
    "mShape": "line",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  },
  "melancholy": {
    "eShape": "half-closed",
    "mShape": "curve",
    "eColor": "#6666aa",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -10,
    "mWidth": 40,
    "extras": []
  },
  "gloomy": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#444488",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -15,
    "mWidth": 40,
    "extras": []
  },
  "pessimistic": {
    "eShape": "squint",
    "mShape": "curve",
    "eColor": "#555555",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -10,
    "mWidth": 40,
    "extras": []
  },
  "bitter": {
    "eShape": "squint",
    "mShape": "curve",
    "eColor": "#88aa55",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -15,
    "mWidth": 40,
    "extras": []
  },
  "shy": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#ffaaff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 10,
    "mWidth": 40,
    "extras": [
      "blush"
    ]
  },
  "embarrassed": {
    "eShape": "circle",
    "mShape": "wavy",
    "eColor": "#ff5555",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "blush",
      "sweat"
    ]
  },
  "flirty": {
    "eShape": "wink",
    "mShape": "curve",
    "eColor": "#ff00aa",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 20,
    "mWidth": 40,
    "extras": [
      "hearts"
    ]
  },
  "sarcastic": {
    "eShape": "half-closed",
    "mShape": "asym-smile",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 10,
    "mWidth": 40,
    "extras": []
  },
  "smug": {
    "eShape": "half-closed",
    "mShape": "asym-smile",
    "eColor": "#aaff00",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 15,
    "mWidth": 40,
    "extras": []
  },
  "apologetic": {
    "eShape": "arch-down",
    "mShape": "wavy",
    "eColor": "#aaaaaa",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": -5,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "sympathetic": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#aaaaff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": -5,
    "mWidth": 40,
    "extras": []
  },
  "curious": {
    "eShape": "circle",
    "mShape": "o",
    "eColor": "#ffff00",
    "eSize": 1.1,
    "pSize": 0.5,
    "mCurve": 5,
    "mWidth": 15,
    "extras": [
      "question"
    ]
  },
  "suspicious": {
    "eShape": "squint",
    "mShape": "line",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  },
  "mischievous": {
    "eShape": "arch",
    "mShape": "zigzag",
    "eColor": "#cc55ff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 15,
    "mWidth": 40,
    "extras": []
  },
  "tired": {
    "eShape": "half-closed",
    "mShape": "curve",
    "eColor": "#8888ff",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "bags"
    ]
  },
  "hungry": {
    "eShape": "circle",
    "mShape": "open-smile",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 10,
    "mWidth": 30,
    "extras": [
      "drool"
    ]
  },
  "sick": {
    "eShape": "squint",
    "mShape": "wavy",
    "eColor": "#55ff55",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "dizzy": {
    "eShape": "spiral",
    "mShape": "wavy",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "stars"
    ]
  },
  "freezing": {
    "eShape": "squint",
    "mShape": "zigzag",
    "eColor": "#88ffff",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "ice"
    ]
  },
  "hot": {
    "eShape": "half-closed",
    "mShape": "open-sad",
    "eColor": "#ff5500",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "energetic": {
    "eShape": "star",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.2,
    "pSize": 0.6,
    "mCurve": 25,
    "mWidth": 40,
    "extras": [
      "sparks"
    ]
  },
  "relaxed": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 10,
    "mWidth": 40,
    "extras": []
  },
  "uncomfortable": {
    "eShape": "circle",
    "mShape": "wavy",
    "eColor": "#ffaaaa",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "pain": {
    "eShape": "x",
    "mShape": "zigzag",
    "eColor": "#ff0000",
    "eSize": 1.0,
    "pSize": 0.1,
    "mCurve": -15,
    "mWidth": 40,
    "extras": [
      "tears"
    ]
  },
  "thinking": {
    "eShape": "asym",
    "mShape": "line",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "loading"
    ]
  },
  "focused": {
    "eShape": "squint",
    "mShape": "line",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  },
  "daydreaming": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#ffaaff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 15,
    "mWidth": 40,
    "extras": [
      "bubbles"
    ]
  },
  "mindblown": {
    "eShape": "circle",
    "mShape": "o",
    "eColor": "#ff00ff",
    "eSize": 1.3,
    "pSize": 0.1,
    "mCurve": 20,
    "mWidth": 40,
    "extras": [
      "sparks"
    ]
  },
  "eureka": {
    "eShape": "star",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.2,
    "pSize": 0.6,
    "mCurve": 25,
    "mWidth": 40,
    "extras": [
      "bulb"
    ]
  },
  "calculating": {
    "eShape": "spinner",
    "mShape": "line",
    "eColor": "#00ff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "numbers"
    ]
  },
  "puzzled": {
    "eShape": "asym",
    "mShape": "wavy",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "question"
    ]
  },
  "overwhelmed": {
    "eShape": "spiral",
    "mShape": "zigzag",
    "eColor": "#ff5555",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "sweat"
    ]
  },
  "determined": {
    "eShape": "squint",
    "mShape": "curve",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": 10,
    "mWidth": 40,
    "extras": [
      "fire"
    ]
  },
  "contemplating": {
    "eShape": "half-closed",
    "mShape": "asym-smile",
    "eColor": "#aaaaff",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": 5,
    "mWidth": 40,
    "extras": []
  },
  "booting": {
    "eShape": "line",
    "mShape": "line",
    "eColor": "#00ff00",
    "eSize": 0.5,
    "pSize": 0.1,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "loading"
    ]
  },
  "charging": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#00ff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 10,
    "mWidth": 40,
    "extras": [
      "bolt"
    ]
  },
  "low_battery": {
    "eShape": "half-closed",
    "mShape": "curve",
    "eColor": "#ff0000",
    "eSize": 0.8,
    "pSize": 0.2,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "battery-low"
    ]
  },
  "error": {
    "eShape": "x",
    "mShape": "zigzag",
    "eColor": "#ff0000",
    "eSize": 1.0,
    "pSize": 0.1,
    "mCurve": -15,
    "mWidth": 40,
    "extras": [
      "error-glitch"
    ]
  },
  "updating": {
    "eShape": "spinner",
    "mShape": "line",
    "eColor": "#00aaff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "loading"
    ]
  },
  "scanning": {
    "eShape": "line",
    "mShape": "line",
    "eColor": "#00ff00",
    "eSize": 1.1,
    "pSize": 0.8,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "scan-line"
    ]
  },
  "processing": {
    "eShape": "spinner",
    "mShape": "line",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "loading"
    ]
  },
  "idle": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 5,
    "mWidth": 40,
    "extras": []
  },
  "listening": {
    "eShape": "circle",
    "mShape": "o",
    "eColor": "#00ffaa",
    "eSize": 1.1,
    "pSize": 0.5,
    "mCurve": 5,
    "mWidth": 10,
    "extras": [
      "waves"
    ]
  },
  "speaking": {
    "eShape": "circle",
    "mShape": "wavy",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 10,
    "mWidth": 40,
    "extras": [
      "waves"
    ]
  },
  "alert": {
    "eShape": "circle",
    "mShape": "open-sad",
    "eColor": "#ff0000",
    "eSize": 1.2,
    "pSize": 0.2,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "exclamation"
    ]
  },
  "malfunction": {
    "eShape": "asym",
    "mShape": "zigzag",
    "eColor": "#ff00ff",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -20,
    "mWidth": 40,
    "extras": [
      "sparks",
      "error-glitch"
    ]
  },
  "rebooting": {
    "eShape": "spinner",
    "mShape": "line",
    "eColor": "#00ff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 0,
    "mWidth": 40,
    "extras": [
      "loading"
    ]
  },
  "connected": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#00ff00",
    "eSize": 1.0,
    "pSize": 0.6,
    "mCurve": 20,
    "mWidth": 40,
    "extras": [
      "wifi"
    ]
  },
  "disconnected": {
    "eShape": "x",
    "mShape": "curve",
    "eColor": "#ff5555",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -15,
    "mWidth": 40,
    "extras": [
      "wifi-off"
    ]
  },
  "greeting": {
    "eShape": "arch",
    "mShape": "open-smile",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 25,
    "mWidth": 40,
    "extras": [
      "wave"
    ]
  },
  "farewell": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#aaaaff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": -10,
    "mWidth": 40,
    "extras": [
      "wave"
    ]
  },
  "celebrating": {
    "eShape": "star",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.6,
    "mCurve": 30,
    "mWidth": 40,
    "extras": [
      "confetti"
    ]
  },
  "dancing": {
    "eShape": "arch",
    "mShape": "curve",
    "eColor": "#ff00ff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 20,
    "mWidth": 40,
    "extras": [
      "music"
    ]
  },
  "laughing": {
    "eShape": "arch",
    "mShape": "open-smile",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 35,
    "mWidth": 40,
    "extras": [
      "tears"
    ]
  },
  "crying": {
    "eShape": "arch-down",
    "mShape": "open-sad",
    "eColor": "#4488ff",
    "eSize": 1.0,
    "pSize": 0.2,
    "mCurve": -25,
    "mWidth": 40,
    "extras": [
      "tears"
    ]
  },
  "yawning": {
    "eShape": "half-closed",
    "mShape": "o",
    "eColor": "#8888ff",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": 20,
    "mWidth": 30,
    "extras": [
      "z"
    ]
  },
  "winking": {
    "eShape": "wink",
    "mShape": "curve",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 20,
    "mWidth": 40,
    "extras": []
  },
  "nodding": {
    "eShape": "circle",
    "mShape": "curve",
    "eColor": "#00ff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 15,
    "mWidth": 40,
    "extras": []
  },
  "shaking_head": {
    "eShape": "half-closed",
    "mShape": "curve",
    "eColor": "#ffaa00",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": -5,
    "mWidth": 40,
    "extras": []
  },
  "saluting": {
    "eShape": "squint",
    "mShape": "line",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  },
  "bowing": {
    "eShape": "arch-down",
    "mShape": "curve",
    "eColor": "#00ffaa",
    "eSize": 1.0,
    "pSize": 0.3,
    "mCurve": 10,
    "mWidth": 40,
    "extras": []
  },
  "clapping": {
    "eShape": "arch",
    "mShape": "open-smile",
    "eColor": "#ffff00",
    "eSize": 1.0,
    "pSize": 0.5,
    "mCurve": 25,
    "mWidth": 40,
    "extras": [
      "sparks"
    ]
  },
  "pointing": {
    "eShape": "circle",
    "mShape": "o",
    "eColor": "#00ffff",
    "eSize": 1.0,
    "pSize": 0.6,
    "mCurve": 10,
    "mWidth": 15,
    "extras": []
  },
  "shrugging": {
    "eShape": "asym",
    "mShape": "line",
    "eColor": "#aaaaaa",
    "eSize": 1.0,
    "pSize": 0.4,
    "mCurve": 0,
    "mWidth": 40,
    "extras": []
  }
};

export const EMOTION_LIST = Object.keys(EMOTIONS);

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 255, b: 255 };
};

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

export default function RobotFace({ emotion = 'happy', size = 300 }) {
  const canvasRef = useRef(null);
  
  const stateRef = useRef({
    currentEmote: EMOTIONS['happy'] || EMOTIONS[Object.keys(EMOTIONS)[0]],
    targetEmote: EMOTIONS['happy'] || EMOTIONS[Object.keys(EMOTIONS)[0]],
    lerpColor: hexToRgb(EMOTIONS['happy']?.eColor || '#00ffff'),
    blinkTimer: 0,
    isBlinking: false,
    time: 0
  });

  useEffect(() => {
    if (EMOTIONS[emotion]) {
      stateRef.current.targetEmote = EMOTIONS[emotion];
    } else {
      stateRef.current.targetEmote = EMOTIONS['neutral'];
    }
  }, [emotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      stateRef.current.time += 0.016; // Approx 60fps
      const state = stateRef.current;
      
      // Lerp properties
      const target = state.targetEmote;
      const current = state.currentEmote;
      
      const lerpSpeed = 0.1;
      current.eSize = lerp(current.eSize, target.eSize, lerpSpeed);
      current.pSize = lerp(current.pSize, target.pSize, lerpSpeed);
      current.mCurve = lerp(current.mCurve, target.mCurve, lerpSpeed);
      current.mWidth = lerp(current.mWidth, target.mWidth, lerpSpeed);
      
      const tColor = hexToRgb(target.eColor);
      state.lerpColor.r = lerp(state.lerpColor.r, tColor.r, lerpSpeed);
      state.lerpColor.g = lerp(state.lerpColor.g, tColor.g, lerpSpeed);
      state.lerpColor.b = lerp(state.lerpColor.b, tColor.b, lerpSpeed);
      
      // Update blink
      if (!state.isBlinking) {
        state.blinkTimer += 1;
        if (state.blinkTimer > 180 + Math.random() * 120) { // Blink every 3-5s
          state.isBlinking = true;
          state.blinkTimer = 0;
        }
      } else {
        state.blinkTimer += 1;
        if (state.blinkTimer > 10) { // Blink duration
          state.isBlinking = false;
          state.blinkTimer = 0;
        }
      }

      // Base dims
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      
      // Clear
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, width, height);
      
      // Idle animation breathing scale
      const breatheScale = 1.0 + Math.sin(state.time * 2) * 0.02;
      
      // Pupil tracking movement
      const lookX = Math.sin(state.time) * 10;
      const lookY = Math.cos(state.time * 0.8) * 5;
      
      const rgbStr = `rgb(${Math.round(state.lerpColor.r)}, ${Math.round(state.lerpColor.g)}, ${Math.round(state.lerpColor.b)})`;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breatheScale, breatheScale);
      
      // Draw Eyes
      const eyeSpacing = width * 0.25;
      const eyeY = -height * 0.1;
      const baseEyeRadius = width * 0.12 * current.eSize;
      
      ctx.shadowColor = rgbStr;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = rgbStr;
      ctx.fillStyle = rgbStr;
      ctx.lineWidth = width * 0.02;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const drawEye = (x, y, shape, isRight) => {
        ctx.save();
        ctx.translate(x, y);
        
        let blinkScale = state.isBlinking ? 0.1 : 1.0;
        ctx.scale(1, blinkScale);
        
        const r = baseEyeRadius;
        
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape === 'arch') {
          ctx.beginPath();
          ctx.arc(0, r/2, r, Math.PI, 0);
          ctx.stroke();
        } else if (shape === 'arch-down') {
          ctx.beginPath();
          ctx.arc(0, -r/2, r, 0, Math.PI);
          ctx.stroke();
        } else if (shape === 'line') {
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.lineTo(r, 0);
          ctx.stroke();
        } else if (shape === 'x') {
          ctx.beginPath();
          ctx.moveTo(-r, -r); ctx.lineTo(r, r);
          ctx.moveTo(r, -r); ctx.lineTo(-r, r);
          ctx.stroke();
        } else if (shape === 'heart') {
          ctx.beginPath();
          ctx.moveTo(0, r*0.5);
          ctx.bezierCurveTo(-r, -r*0.2, -r*0.5, -r, 0, -r*0.5);
          ctx.bezierCurveTo(r*0.5, -r, r, -r*0.2, 0, r*0.5);
          ctx.fill();
        } else if (shape === 'star') {
          ctx.beginPath();
          for(let i=0; i<5; i++){
            ctx.lineTo(Math.cos(i*4*Math.PI/5)*r, Math.sin(i*4*Math.PI/5)*r);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (shape === 'squint') {
          ctx.beginPath();
          ctx.moveTo(-r, isRight ? -r/2 : r/2);
          ctx.lineTo(r, isRight ? r/2 : -r/2);
          ctx.stroke();
        } else if (shape === 'wink') {
          if (isRight) {
             ctx.beginPath();
             ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
             ctx.stroke();
          } else {
             ctx.beginPath();
             ctx.arc(0, 0, r, 0, Math.PI * 2);
             ctx.stroke();
          }
        } else if (shape === 'half-closed') {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI);
          ctx.closePath();
          ctx.fill();
        } else if (shape === 'asym') {
          if (isRight) {
             ctx.beginPath();
             ctx.arc(0, 0, r, 0, Math.PI * 2);
             ctx.stroke();
          } else {
             ctx.beginPath();
             ctx.moveTo(-r, -r/2); ctx.lineTo(r, r/2);
             ctx.stroke();
          }
        } else if (shape === 'spiral') {
          ctx.beginPath();
          for(let i=0; i<30; i++){
            const angle = 0.5 * i;
            const sx = (1 + angle) * Math.cos(angle + state.time*5) * (r/15);
            const sy = (1 + angle) * Math.sin(angle + state.time*5) * (r/15);
            if(i===0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        } else if (shape === 'spinner') {
          ctx.beginPath();
          ctx.arc(0, 0, r, state.time*5, state.time*5 + Math.PI*1.5);
          ctx.stroke();
        } else {
          // Fallback circle
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Draw Pupil if applicable
        if (!state.isBlinking && ['circle', 'wink', 'asym'].includes(shape)) {
           // simple condition to avoid drawing pupil if the eye is closed or x
           if (shape !== 'wink' || !isRight) {
               if (shape !== 'asym' || isRight) {
                   ctx.beginPath();
                   ctx.arc(lookX, lookY, r * current.pSize, 0, Math.PI * 2);
                   ctx.fill();
               }
           }
        }
        
        ctx.restore();
      };
      
      const eShape = target.eShape || 'circle';
      drawEye(-eyeSpacing, eyeY, eShape, false);
      drawEye(eyeSpacing, eyeY, eShape, true);
      
      // Draw Mouth
      ctx.shadowBlur = 10;
      const mouthY = height * 0.15;
      const mWidth = (width * 0.01 * current.mWidth);
      const mCurve = (height * 0.005 * current.mCurve);
      
      ctx.save();
      ctx.translate(0, mouthY);
      
      const mShape = target.mShape || 'curve';
      
      ctx.beginPath();
      if (mShape === 'curve') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve, mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'line') {
        ctx.moveTo(-mWidth, 0);
        ctx.lineTo(mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'o') {
        ctx.arc(0, mCurve/2, Math.abs(mWidth/2), 0, Math.PI * 2);
        ctx.stroke();
      } else if (mShape === 'open-smile') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve*1.5, mWidth, 0);
        ctx.lineTo(-mWidth, 0);
        ctx.fill();
      } else if (mShape === 'open-sad') {
        ctx.moveTo(-mWidth, mCurve*1.5);
        ctx.quadraticCurveTo(0, 0, mWidth, mCurve*1.5);
        ctx.lineTo(-mWidth, mCurve*1.5);
        ctx.fill();
      } else if (mShape === 'wavy') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(-mWidth/2, -10, 0, 0);
        ctx.quadraticCurveTo(mWidth/2, 10, mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'zigzag') {
        ctx.moveTo(-mWidth, 0);
        ctx.lineTo(-mWidth/2, -10);
        ctx.lineTo(0, 10);
        ctx.lineTo(mWidth/2, -10);
        ctx.lineTo(mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'asym-smile') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve, mWidth, -mCurve);
        ctx.stroke();
      } else {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve, mWidth, 0);
        ctx.stroke();
      }
      ctx.restore();
      
      // Extras
      const extras = target.extras || [];
      ctx.fillStyle = rgbStr;
      ctx.font = `${width*0.1}px Arial`;
      ctx.textAlign = 'center';
      
      const t = state.time;
      extras.forEach(extra => {
         if (extra === 'tears') {
            const ty = (t * 50) % 50;
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY + baseEyeRadius + ty, 5, 0, Math.PI*2);
            ctx.arc(eyeSpacing, eyeY + baseEyeRadius + ty, 5, 0, Math.PI*2);
            ctx.fill();
         }
         if (extra === 'sweat') {
            ctx.beginPath();
            ctx.arc(eyeSpacing + 30, eyeY - baseEyeRadius + Math.sin(t*2)*5, 8, 0, Math.PI*2);
            ctx.fill();
         }
         if (extra === 'blush') {
            ctx.fillStyle = 'rgba(255, 100, 150, 0.5)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(-eyeSpacing*1.2, eyeY + baseEyeRadius*1.5, 20, 0, Math.PI*2);
            ctx.arc(eyeSpacing*1.2, eyeY + baseEyeRadius*1.5, 20, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = rgbStr;
            ctx.shadowBlur = 20;
         }
         if (extra === 'z') {
            ctx.fillText('Z', eyeSpacing + 40 + Math.sin(t)*10, eyeY - 20 - (t*20)%40);
         }
         if (extra === 'hearts') {
            ctx.fillText('❤', -eyeSpacing - 40, eyeY - 20 + Math.sin(t*3)*10);
            ctx.fillText('❤', eyeSpacing + 40, eyeY - 20 + Math.sin(t*3+1)*10);
         }
         if (extra === 'question') {
            ctx.fillText('?', eyeSpacing + 30, eyeY - 30);
         }
         if (extra === 'exclamation') {
            ctx.fillText('!', 0, eyeY - 40);
         }
         if (extra === 'loading') {
            ctx.save();
            ctx.translate(0, -height*0.3);
            ctx.rotate(t * 3);
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI*1.5);
            ctx.stroke();
            ctx.restore();
         }
      });
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        backgroundColor: 'transparent'
      }}
    />
  );
}
