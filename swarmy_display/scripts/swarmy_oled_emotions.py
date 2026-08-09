#!/usr/bin/env python3
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

import math
import time
import os
import traceback
from PIL import Image, ImageDraw

try:
    import rospy
    from std_msgs.msg import String
    ROS_AVAILABLE = True
except ImportError:
    ROS_AVAILABLE = False

from luma.core.interface.serial import i2c
from luma.oled.device import ssd1309

LEX = 38
REX = 90
EY_BASE = 20
EYE_RX = 14
EYE_RY = 11
MOUTH_CX = 64
MOUTH_Y = 50

def thick_arc(draw, bbox, start, end, fill, w):
    for i in range(w):
        b = [bbox[0] + i, bbox[1] + i, bbox[2] - i, bbox[3] - i]
        if b[0] > b[2] or b[1] > b[3]:
            break
        draw.arc(b, start, end, fill=fill)

def thick_line(draw, xy, fill, w):
    if len(xy) == 2 and isinstance(xy[0], (tuple, list)):
        x0, y0 = xy[0]
        x1, y1 = xy[1]
    else:
        x0, y0, x1, y1 = xy
    dx = x1 - x0
    dy = y1 - y0
    length = math.hypot(dx, dy)
    if length == 0:
        return
    nx = -dy / length
    ny = dx / length
    for i in range(w):
        offset = i - w // 2
        draw.line([(x0 + nx * offset, y0 + ny * offset),
                   (x1 + nx * offset, y1 + ny * offset)], fill=fill)

class SwarmyEmotionDisplay:
    def __init__(self):
        self.serial = i2c(port=1, address=0x3C)
        self.device = ssd1309(self.serial)
        self.current_emotion = 'IDLE'
        self.last_update = time.time()
        self.frame = 0
        self.blink_time = time.time() + 2.6
        self.ros_initialized = False

        self.emotion_map = {
            'IDLE': self._render_idle,
            'HAPPY': self._render_happy,
            'SAD': self._render_sad,
            'ANGRY': self._render_angry,
            'CONFUSED': self._render_confused,
            'ALERT': self._render_alert,
            'LOVE': self._render_love,
            'SLEEP': self._render_sleep,
            'BOOT': self._render_boot,
            'WARN': self._render_warn,
            'NAVIGATING': self._render_navigating,
            'CRUISING': self._render_cruising,
            'EXPLORING': self._render_exploring,
            'SEARCHING': self._render_searching,
            'TURNING_LEFT': self._render_turning_left,
            'TURNING_RIGHT': self._render_turning_right,
            'CAUTIOUS': self._render_cautious,
            'WORRIED': self._render_worried,
            'ANNOYED': self._render_annoyed,
            'FRUSTRATED': self._render_frustrated,
            'SCARED': self._render_scared,
            'SHOCKED': self._render_shocked,
            'GOAL_REACHED': self._render_goal_reached,
            'CELEBRATING': self._render_celebrating,
            'PROUD': self._render_proud,
            'VICTORIOUS': self._render_victorious,
            'ACCOMPLISHED': self._render_accomplished,
            'EXCITED': self._render_excited,
            'JOYFUL': self._render_joyful,
            'CHEERFUL': self._render_cheerful,
            'LAUGHING': self._render_laughing,
            'GIGGLING': self._render_giggling,
            'DELIGHTED': self._render_delighted,
            'BLISSFUL': self._render_blissful,
            'DISAPPOINTED': self._render_disappointed,
            'LONELY': self._render_lonely,
            'MELANCHOLY': self._render_melancholy,
            'SORRY': self._render_sorry,
            'FURIOUS': self._render_furious,
            'GRUMPY': self._render_grumpy,
            'IRRITATED': self._render_irritated,
            'WINK': self._render_wink,
            'PLAYFUL': self._render_playful,
            'MISCHIEVOUS': self._render_mischievous,
            'SILLY': self._render_silly,
            'DIZZY': self._render_dizzy,
            'SHY': self._render_shy,
            'COOL': self._render_cool,
            'DETERMINED': self._render_determined,
            'CONFIDENT': self._render_confident,
            'SKEPTICAL': self._render_skeptical,
            'NERVOUS': self._render_nervous,
            'RELIEVED': self._render_relieved,
            'THANKFUL': self._render_thankful,
            'CURIOUS': self._render_curious,
            'THINKING': self._render_thinking,
            'BORED': self._render_bored,
            'DAYDREAMING': self._render_daydreaming,
            'YAWNING': self._render_yawning,
            'DROWSY': self._render_drowsy,
            'SINGING': self._render_singing,
            'DANCING': self._render_dancing,
            'SURPRISED': self._render_surprised,
            'AMAZED': self._render_amazed,
            'STUNNED': self._render_stunned,
            'MOVING_FORWARD': self._render_moving_forward,
            'BACKING_UP': self._render_backing_up,
            'AVOIDING_LEFT': self._render_avoiding_left,
            'AVOIDING_RIGHT': self._render_avoiding_right,
            'STUCK': self._render_stuck,
            'RECOVERING': self._render_recovering,
            'PLANNING': self._render_planning,
            'WAITING': self._render_waiting,
            'STARTING': self._render_starting,
            'STOPPING': self._render_stopping,
            'ARRIVED': self._render_arrived,
            'DOCKING': self._render_docking,
            'CHARGING': self._render_charging,
            'LOW_BATTERY': self._render_low_battery,
            'ERROR': self._render_error
        }

    def _eye(self, draw, cx, cy, rx, ry, type='normal', look_x=0, look_y=0, blink=False, bob=0):
        cy += bob
        if blink:
            # Realistic blink: closed eyelid arc with small lash curves
            thick_line(draw, (cx - rx, cy, cx + rx, cy), 'white', 2)
            draw.arc([cx - rx, cy - 3, cx + rx, cy + 3], 0, 180, fill='white')
            return

        if type == 'normal':
            # Full realistic eye: white sclera, dark iris, pupil, highlight
            draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill='white', outline='white')
            # Iris (dark ring)
            ir = 6
            ix, iy = cx + look_x, cy + look_y
            draw.ellipse([ix-ir, iy-ir, ix+ir, iy+ir], fill='black')
            # Pupil (smaller dark center)
            pr = 3
            draw.ellipse([ix-pr, iy-pr, ix+pr, iy+pr], fill='black')
            # Specular highlight (white glint top-left of iris)
            draw.ellipse([ix-ir+1, iy-ir+1, ix-ir+4, iy-ir+4], fill='white')

        elif type == 'squint':
            # Happy squint: thick inverted arc with lash accent
            thick_arc(draw, [cx-rx, cy-ry, cx+rx, cy+ry], 200, 340, 'white', 3)
            thick_arc(draw, [cx-rx+2, cy-ry+2, cx+rx-2, cy+ry-2], 210, 330, 'white', 2)

        elif type == 'sad':
            # Sad: full eye with worried upward-angled brow
            draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill='white', outline='white')
            ir = 6
            ix, iy = cx + look_x, cy + look_y + 2  # pupils look down
            draw.ellipse([ix-ir, iy-ir, ix+ir, iy+ir], fill='black')
            draw.ellipse([ix-ir+1, iy-ir+1, ix-ir+4, iy-ir+4], fill='white')
            # Worried brow
            if cx < 64:
                thick_line(draw, (cx-rx, cy-ry-1, cx+rx-4, cy-ry-5), 'white', 2)
            else:
                thick_line(draw, (cx-rx+4, cy-ry-5, cx+rx, cy-ry-1), 'white', 2)

        elif type == 'angry':
            # Angry: squinted eye with heavy inward V-brow
            draw.ellipse([cx-rx, cy-ry+3, cx+rx, cy+ry], fill='white', outline='white')
            ir = 5
            ix, iy = cx + look_x, cy + look_y + 1
            draw.ellipse([ix-ir, iy-ir, ix+ir, iy+ir], fill='black')
            draw.ellipse([ix-ir+1, iy-ir+1, ix-ir+3, iy-ir+3], fill='white')
            # Heavy V-brow
            if cx < 64:
                thick_line(draw, (cx-rx-2, cy-ry-3, cx+rx, cy-ry+3), 'white', 3)
            else:
                thick_line(draw, (cx-rx, cy-ry+3, cx+rx+2, cy-ry-3), 'white', 3)

        elif type == 'wide':
            # Wide surprised eye: bigger sclera, tiny iris
            erx, ery = rx + 3, ry + 3
            draw.ellipse([cx-erx, cy-ery, cx+erx, cy+ery], fill='white', outline='white')
            ir = 4
            ix, iy = cx + look_x, cy + look_y
            draw.ellipse([ix-ir, iy-ir, ix+ir, iy+ir], fill='black')
            pr = 2
            draw.ellipse([ix-pr, iy-pr, ix+pr, iy+pr], fill='black')
            draw.ellipse([ix-ir+1, iy-ir+1, ix-ir+3, iy-ir+3], fill='white')

        elif type == 'heart':
            # Heart-shaped eye
            s = rx * 0.08
            pts = [
                (cx, int(cy + 4*s)), (int(cx - 6*s), int(cy - 1*s)),
                (int(cx - 9*s), int(cy + 2*s)), (int(cx - 5*s), int(cy + 7*s)),
                (cx, int(cy + 11*s)), (int(cx + 5*s), int(cy + 7*s)),
                (int(cx + 9*s), int(cy + 2*s)), (int(cx + 6*s), int(cy - 1*s)),
            ]
            draw.polygon(pts, fill='white')

        elif type == 'closed_down':
            # Peacefully closed: gentle downward arc with lash
            thick_arc(draw, [cx-rx, cy-4, cx+rx, cy+8], 0, 180, 'white', 2)
            draw.line([(cx-rx+2, cy+1), (cx+rx-2, cy+1)], fill='white')

        elif type == 'x':
            # X-eyes (error/dizzy)
            thick_line(draw, (cx-rx+3, cy-ry+3, cx+rx-3, cy+ry-3), 'white', 3)
            thick_line(draw, (cx-rx+3, cy+ry-3, cx+rx-3, cy-ry+3), 'white', 3)

        elif type == 'star':
            # Star-shaped sparkle eye
            pts = []
            for i in range(10):
                angle = i * math.pi / 5 - math.pi / 2
                r = rx if i % 2 == 0 else rx * 0.4
                pts.append((int(cx + r * math.cos(angle)), int(cy + r * math.sin(angle))))
            draw.polygon(pts, fill='white')

        elif type == 'flat':
            # Closed wink line with small lash
            thick_line(draw, (cx-rx, cy, cx+rx, cy), 'white', 2)
            draw.arc([cx-rx, cy-4, cx+rx, cy+4], 0, 180, fill='white')

        elif type == 'half_closed':
            # Heavy-lidded eye: full eyeball with eyelid covering top half
            draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill='white', outline='white')
            # Iris + pupil (lower position since lid is heavy)
            ir = 5
            ix, iy = cx + look_x, cy + look_y + 2
            draw.ellipse([ix-ir, iy-ir, ix+ir, iy+ir], fill='black')
            draw.ellipse([ix-ir+1, iy-ir+1, ix-ir+3, iy-ir+3], fill='white')
            # Eyelid covers top portion
            draw.rectangle([cx-rx-1, cy-ry-1, cx+rx+1, cy-2], fill='black')
            thick_line(draw, (cx-rx, cy-2, cx+rx, cy-2), 'white', 2)

    def _mouth(self, draw, cx, cy, type='smile', bob=0):
        cy += bob
        if type == 'smile':
            # Gentle closed-lip smile with lip thickness
            thick_arc(draw, [cx-16, cy-4, cx+16, cy+6], 10, 170, 'white', 2)
            draw.arc([cx-12, cy-2, cx+12, cy+8], 0, 180, fill='white')

        elif type == 'frown':
            # Downturned frown with lower lip accent
            thick_arc(draw, [cx-16, cy-4, cx+16, cy+8], 190, 350, 'white', 2)
            draw.arc([cx-12, cy, cx+12, cy+10], 200, 340, fill='white')

        elif type == 'open_smile':
            # Wide open D-mouth with teeth and tongue
            mw = 20
            # Mouth cavity
            draw.chord([cx-mw, cy-4, cx+mw, cy+14], 0, 180, outline='white', fill='black')
            # Upper lip
            thick_arc(draw, [cx-mw, cy-6, cx+mw, cy+2], 10, 170, 'white', 2)
            # Teeth row with individual gaps
            tx1, tx2 = cx - 14, cx + 14
            draw.rectangle([tx1, cy-1, tx2, cy+4], fill='white')
            for x in range(tx1 + 4, tx2, 5):
                draw.line([(x, cy-1), (x, cy+4)], fill='black')
            # Tongue (curved bump at bottom)
            draw.chord([cx-8, cy+4, cx+8, cy+13], 0, 180, fill='white')

        elif type == 'flat':
            # Neutral pressed lips
            thick_line(draw, (cx-12, cy, cx+12, cy), 'white', 2)
            draw.arc([cx-8, cy-2, cx+8, cy+4], 0, 180, fill='white')

        elif type == 'zigzag':
            # Wavy uncertain mouth with lip thickness
            pts = [(cx-15, cy), (cx-8, cy-4), (cx, cy+4), (cx+8, cy-4), (cx+15, cy)]
            for i in range(len(pts) - 1):
                thick_line(draw, (pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]), 'white', 2)

        elif type == 'o':
            # Surprised O-mouth with lip ring
            draw.ellipse([cx-8, cy-6, cx+8, cy+8], outline='white', fill='black')
            draw.ellipse([cx-6, cy-4, cx+6, cy+6], fill='black')
            # Upper lip highlight
            thick_arc(draw, [cx-8, cy-8, cx+8, cy], 200, 340, 'white', 2)
            # Lower lip
            thick_arc(draw, [cx-6, cy+2, cx+6, cy+10], 10, 170, 'white', 2)

        elif type == 'teeth_baring':
            # Clenched teeth grimace with upper and lower rows
            mw = 18
            draw.chord([cx-mw, cy-4, cx+mw, cy+10], 0, 180, outline='white', fill='black')
            # Upper teeth
            tx1, tx2 = cx - 14, cx + 14
            draw.rectangle([tx1, cy-2, tx2, cy+2], fill='white')
            for x in range(tx1 + 4, tx2, 5):
                draw.line([(x, cy-2), (x, cy+2)], fill='black')
            # Lower teeth
            draw.rectangle([tx1, cy+3, tx2, cy+6], fill='white')
            for x in range(tx1 + 2, tx2, 5):
                draw.line([(x, cy+3), (x, cy+6)], fill='black')
            # Gap between rows
            draw.line([(tx1, cy+2), (tx2, cy+2)], fill='black')

        elif type == 'tiny':
            # Small relaxed slightly-parted lips
            thick_arc(draw, [cx-6, cy-2, cx+6, cy+4], 10, 170, 'white', 2)
            draw.arc([cx-4, cy, cx+4, cy+5], 0, 180, fill='white')

        elif type == 'huge_grin':
            # Massive celebration grin with teeth and tongue
            mw = 24
            draw.chord([cx-mw, cy-6, cx+mw, cy+16], 0, 180, outline='white', fill='black')
            # Upper lip
            thick_arc(draw, [cx-mw, cy-8, cx+mw, cy+2], 10, 170, 'white', 2)
            # Big teeth row
            tx1, tx2 = cx - 18, cx + 18
            draw.rectangle([tx1, cy-3, tx2, cy+3], fill='white')
            for x in range(tx1 + 4, tx2, 5):
                draw.line([(x, cy-3), (x, cy+3)], fill='black')
            # Tongue
            draw.chord([cx-10, cy+4, cx+10, cy+15], 0, 180, fill='white')

    def _decorations(self, draw, dec_type, bob=0):
        if dec_type == 'z':
            # Floating Z's animation (three stages)
            z_phase = self.frame % 30
            if z_phase > 4:
                draw.text((80, 8), 'z', fill='white')
            if z_phase > 12:
                draw.text((92, 2), 'z', fill='white')
            if z_phase > 20:
                draw.text((104, -2), 'Z', fill='white')

        elif dec_type == 'teardrop':
            # Animated falling teardrop with trail
            t_phase = (self.frame % 24) / 24.0
            ty = int(EY_BASE + EYE_RY + 3 + t_phase * 14) + bob
            if t_phase < 0.85:
                # Teardrop shape (triangle top + circle bottom)
                draw.polygon([(LEX+6, ty-3), (LEX+4, ty+1), (LEX+8, ty+1)], fill='white')
                draw.ellipse([LEX+3, ty, LEX+9, ty+5], fill='white')

        elif dec_type == '?':
            draw.text((112, 4), '?', fill='white')
            draw.text((110, 2), '?', fill='white')  # bold

        elif dec_type == '!':
            draw.text((112, 4), '!', fill='white')
            draw.text((110, 2), '!', fill='white')  # bold

        elif dec_type == 'hearts':
            # Floating animated hearts
            fy = int(3 * math.sin(self.frame / 5.0))
            for hx, hy, s in [(12, 10 + fy, 0.5), (116, 6 - fy, 0.6)]:
                pts = [
                    (hx, int(hy+4*s)), (int(hx-6*s), int(hy-1*s)),
                    (int(hx-9*s), int(hy+2*s)), (int(hx-5*s), int(hy+7*s)),
                    (hx, int(hy+11*s)), (int(hx+5*s), int(hy+7*s)),
                    (int(hx+9*s), int(hy+2*s)), (int(hx+6*s), int(hy-1*s)),
                ]
                draw.polygon(pts, fill='white')

        elif dec_type == 'sweat':
            # Animated sweat drop sliding down
            sy = 14 + (self.frame % 12) + bob
            draw.polygon([(112, sy-4), (110, sy), (114, sy)], fill='white')
            draw.ellipse([109, sy, 115, sy+4], fill='white')

        elif dec_type == 'sweat_both':
            # Sweat drops on both sides
            sy = 14 + (self.frame % 12) + bob
            draw.polygon([(112, sy-4), (110, sy), (114, sy)], fill='white')
            draw.ellipse([109, sy, 115, sy+4], fill='white')
            draw.polygon([(16, sy-4), (14, sy), (18, sy)], fill='white')
            draw.ellipse([13, sy, 19, sy+4], fill='white')

        elif dec_type == 'sparkles':
            # Animated twinkling sparkles (rotating star shapes)
            phase = self.frame % 16
            for sx, sy in [(14, 12), (114, 8), (10, 48), (118, 44)]:
                if (phase + sx) % 8 < 4:
                    # Small cross sparkle
                    draw.line([(sx-2, sy), (sx+2, sy)], fill='white')
                    draw.line([(sx, sy-2), (sx, sy+2)], fill='white')
                else:
                    # Small X sparkle
                    draw.line([(sx-2, sy-2), (sx+2, sy+2)], fill='white')
                    draw.line([(sx-2, sy+2), (sx+2, sy-2)], fill='white')

        elif dec_type == '>':
            # Forward arrow
            thick_line(draw, (110, 28, 118, 34), 'white', 2)
            thick_line(draw, (118, 34, 110, 40), 'white', 2)
            thick_line(draw, (106, 34, 118, 34), 'white', 2)

        elif dec_type == '<':
            # Backward arrow
            thick_line(draw, (18, 28, 10, 34), 'white', 2)
            thick_line(draw, (10, 34, 18, 40), 'white', 2)
            thick_line(draw, (10, 34, 22, 34), 'white', 2)

        elif dec_type == 'notes':
            # Musical notes floating
            fy = int(3 * math.sin(self.frame / 4.0))
            draw.ellipse([108, 10 + fy, 112, 14 + fy], fill='white')
            draw.line([(112, 10 + fy), (112, 2 + fy)], fill='white')
            draw.ellipse([116, 6 - fy, 120, 10 - fy], fill='white')
            draw.line([(120, 6 - fy), (120, -2 - fy)], fill='white')

    # Base render helper
    def _render_base(self, draw, bob, eye_type='normal', mouth_type='smile', dec=None, look_x=0, look_y=0, blink=False, eye_r_type=None, eye_rx=EYE_RX, eye_ry=EYE_RY, mouth_cy=MOUTH_Y):
        if eye_r_type is None: eye_r_type = eye_type
        self._eye(draw, LEX, EY_BASE, eye_rx, eye_ry, type=eye_type, look_x=look_x, look_y=look_y, blink=blink, bob=bob)
        self._eye(draw, REX, EY_BASE, eye_rx, eye_ry, type=eye_r_type, look_x=look_x, look_y=look_y, blink=blink, bob=bob)
        self._mouth(draw, MOUTH_CX, mouth_cy, type=mouth_type, bob=bob)
        if dec:
            self._decorations(draw, dec, bob=bob)

    # --- Render Methods for Emotions ---

    def _render_idle(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'smile', blink=blink)
    def _render_happy(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'open_smile', blink=blink)
    def _render_sad(self, draw, bob, blink): self._render_base(draw, bob, 'sad', 'frown', 'teardrop', blink=blink)
    def _render_angry(self, draw, bob, blink): self._render_base(draw, bob, 'angry', 'teeth_baring', blink=blink)
    def _render_confused(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'zigzag', '?', eye_r_type='wide', blink=blink)
    def _render_alert(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'o', '!', blink=blink)
    def _render_love(self, draw, bob, blink): self._render_base(draw, bob, 'heart', 'smile', 'hearts', blink=blink)
    def _render_sleep(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'tiny', 'z', blink=blink)
    
    def _render_boot(self, draw, bob, blink):
        draw.text((30, 25), "SWARMY", fill="white")
        dots = "." * ((self.frame // 5) % 4)
        draw.text((30, 40), f"BOOT{dots}", fill="white")

    def _render_warn(self, draw, bob, blink):
        draw.polygon([(64, 10), (30, 50), (98, 50)], outline="white")
        draw.text((61, 25), "!", fill="white")

    def _render_navigating(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'smile', '>', blink=blink)
    def _render_cruising(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'smile', blink=blink)
    def _render_exploring(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'o', look_x=int(4*math.sin(self.frame/4.0)), blink=blink)
    def _render_searching(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', look_x=int(6*math.sin(self.frame/2.0)), blink=blink)
    def _render_turning_left(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', look_x=-6, blink=blink)
    def _render_turning_right(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', look_x=6, blink=blink)

    def _render_cautious(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', blink=blink)
    def _render_worried(self, draw, bob, blink): self._render_base(draw, bob, 'sad', 'zigzag', blink=blink)
    def _render_annoyed(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'frown', blink=blink)
    def _render_frustrated(self, draw, bob, blink): self._render_base(draw, bob, 'angry', 'teeth_baring', 'sweat', blink=blink)
    def _render_scared(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'zigzag', 'sweat_both', blink=blink)
    def _render_shocked(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'o', '!', blink=blink)

    def _render_goal_reached(self, draw, bob, blink): self._render_base(draw, bob, 'star', 'huge_grin', 'sparkles', blink=blink)
    def _render_celebrating(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'huge_grin', 'sparkles', blink=blink)
    def _render_proud(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'smile', look_y=-2, blink=blink)
    def _render_victorious(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'huge_grin', '!', blink=blink)
    def _render_accomplished(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'smile', blink=blink)
    def _render_excited(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'huge_grin', blink=blink)
    def _render_joyful(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'open_smile', 'sparkles', blink=blink)
    def _render_cheerful(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'smile', look_y=-3, blink=blink)
    def _render_laughing(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'open_smile', 'teardrop', blink=blink)
    def _render_giggling(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'smile', blink=blink)
    def _render_delighted(self, draw, bob, blink): self._render_base(draw, bob, 'star', 'open_smile', blink=blink)
    def _render_blissful(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'smile', 'hearts', blink=blink)

    def _render_disappointed(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'frown', blink=blink)
    def _render_lonely(self, draw, bob, blink): self._render_base(draw, bob, 'sad', 'tiny', 'teardrop', blink=blink)
    def _render_melancholy(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'frown', blink=blink)
    def _render_sorry(self, draw, bob, blink): self._render_base(draw, bob, 'sad', 'frown', 'sweat', blink=blink)
    def _render_furious(self, draw, bob, blink): self._render_base(draw, bob, 'angry', 'zigzag', '!', blink=blink)
    def _render_grumpy(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'frown', blink=blink)
    def _render_irritated(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', eye_r_type='half_closed', blink=blink)

    def _render_wink(self, draw, bob, blink): self._render_base(draw, bob, 'flat', 'smile', eye_r_type='normal', blink=blink)
    def _render_playful(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'open_smile', blink=blink)
    def _render_mischievous(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'smile', blink=blink)
    def _render_silly(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'open_smile', look_x=5, eye_r_type='normal', blink=blink)
    def _render_dizzy(self, draw, bob, blink): self._render_base(draw, bob, 'x', 'zigzag', blink=blink)
    def _render_shy(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'tiny', look_x=-4, look_y=4, blink=blink)
    def _render_cool(self, draw, bob, blink): 
        self._render_base(draw, bob, 'flat', 'smile', blink=blink)
        draw.rectangle([LEX-16, EY_BASE-8+bob, LEX+16, EY_BASE+8+bob], fill='white')
        draw.rectangle([REX-16, EY_BASE-8+bob, REX+16, EY_BASE+8+bob], fill='white')
        thick_line(draw, (LEX+16, EY_BASE+bob, REX-16, EY_BASE+bob), 'white', 3)
    def _render_determined(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', blink=blink)
    def _render_confident(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'smile', look_y=-2, blink=blink)
    def _render_skeptical(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', eye_r_type='normal', blink=blink)
    def _render_nervous(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'zigzag', 'sweat', blink=blink)
    def _render_relieved(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'o', 'sweat', blink=blink)
    def _render_thankful(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'smile', 'sparkles', blink=blink)
    def _render_curious(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'o', eye_r_type='normal', blink=blink)
    def _render_thinking(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', look_x=-4, look_y=-4, blink=blink)
    def _render_bored(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', blink=blink)
    def _render_daydreaming(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'smile', 'sparkles', look_y=-4, blink=blink)
    def _render_yawning(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'o', blink=blink)
    def _render_drowsy(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'tiny', blink=blink)
    def _render_singing(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'o', blink=blink)
    def _render_dancing(self, draw, bob, blink): self._render_base(draw, bob, 'squint', 'open_smile', blink=blink)
    def _render_surprised(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'o', blink=blink)
    def _render_amazed(self, draw, bob, blink): self._render_base(draw, bob, 'star', 'o', blink=blink)
    def _render_stunned(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'flat', blink=blink)

    def _render_moving_forward(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'smile', '>', blink=blink)
    def _render_backing_up(self, draw, bob, blink): self._render_base(draw, bob, 'sad', 'flat', '<', blink=blink)
    def _render_avoiding_left(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', look_x=5, blink=blink)
    def _render_avoiding_right(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', look_x=-5, blink=blink)
    def _render_stuck(self, draw, bob, blink): self._render_base(draw, bob, 'angry', 'teeth_baring', 'sweat', blink=blink)
    def _render_recovering(self, draw, bob, blink): self._render_base(draw, bob, 'determined', 'flat', blink=blink)
    def _render_planning(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', blink=blink)
    def _render_waiting(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', blink=blink)
    def _render_starting(self, draw, bob, blink): self._render_base(draw, bob, 'wide', 'smile', '!', blink=blink)
    def _render_stopping(self, draw, bob, blink): self._render_base(draw, bob, 'normal', 'flat', blink=blink)
    def _render_arrived(self, draw, bob, blink): self._render_base(draw, bob, 'star', 'huge_grin', blink=blink)
    def _render_docking(self, draw, bob, blink): self._render_base(draw, bob, 'half_closed', 'flat', blink=blink)
    def _render_charging(self, draw, bob, blink): self._render_base(draw, bob, 'closed_down', 'smile', blink=blink)
    def _render_low_battery(self, draw, bob, blink): self._render_base(draw, bob, 'sad', 'frown', blink=blink)
    def _render_error(self, draw, bob, blink): self._render_base(draw, bob, 'x', 'flat', '!', blink=blink)


    def emotion_cb(self, msg):
        self.current_emotion = msg.data.strip().upper()
        self.last_update = time.time()

    def update_emotion(self):
        # Read from file fallback
        if os.path.exists('/tmp/robot_emotion.txt'):
            try:
                with open('/tmp/robot_emotion.txt', 'r') as f:
                    em = f.read().strip().upper()
                    if em:
                        self.current_emotion = em
                        self.last_update = time.time()
                os.remove('/tmp/robot_emotion.txt')
            except Exception:
                pass

        if time.time() - self.last_update > 8.0:
            self.current_emotion = 'IDLE'

    def render(self):
        image = Image.new('1', (self.device.width, self.device.height))
        draw = ImageDraw.Draw(image)

        # Bobbing
        bob = int(2 * math.sin(self.frame / 8.0))
        if self.current_emotion == 'EXCITED' or self.current_emotion == 'DANCING':
            bob = int(4 * math.sin(self.frame / 4.0))
        if self.current_emotion in ['STUNNED', 'BOOT', 'WARN', 'ERROR']:
            bob = 0

        # Blinking
        t = time.time()
        blink = False
        if t > self.blink_time:
            blink = True
            if t > self.blink_time + 0.12:
                self.blink_time = t + 2.6
        if self.current_emotion in ['STUNNED', 'SLEEP', 'WINK', 'BOOT', 'WARN', 'ERROR', 'DIZZY']:
            blink = False

        render_func = self.emotion_map.get(self.current_emotion, self._render_idle)
        render_func(draw, bob, blink)

        self.device.display(image)
        self.frame += 1

    def run(self):
        rate_delay = 1.0 / 15.0
        while True:
            if ROS_AVAILABLE and not self.ros_initialized:
                rospy.init_node('swarmy_oled_emotions', anonymous=True, disable_signals=True)
                rospy.Subscriber('/robot_emotion', String, self.emotion_cb)
                self.ros_initialized = True

            try:
                self.update_emotion()
                self.render()
            except Exception as e:
                with open('/tmp/oled_crash.log', 'w') as f:
                    f.write(traceback.format_exc())
            time.sleep(rate_delay)

if __name__ == '__main__':
    try:
        display = SwarmyEmotionDisplay()
        display.run()
    except Exception as e:
        with open('/tmp/oled_crash.log', 'w') as f:
            f.write(traceback.format_exc())
