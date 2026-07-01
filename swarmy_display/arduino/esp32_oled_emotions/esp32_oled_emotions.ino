#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
#define SDA_PIN 21
#define SCL_PIN 22

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
String currentEmotion = "BOOT";
unsigned long lastBlink = 0;
bool blinkState = false;

void drawEyes(int y, int h, bool blink) {
  if (blink) {
    display.fillRoundRect(26, y + h/2, 24, 4, 2, SSD1306_WHITE);
    display.fillRoundRect(78, y + h/2, 24, 4, 2, SSD1306_WHITE);
  } else {
    display.fillRoundRect(24, y, 28, h, 8, SSD1306_WHITE);
    display.fillRoundRect(76, y, 28, h, 8, SSD1306_WHITE);
  }
}

void drawHappy() {
  drawEyes(14, 18, blinkState);
  display.drawCircle(64, 40, 16, SSD1306_WHITE);
  display.fillCircle(56, 34, 2, SSD1306_WHITE);
  display.fillCircle(72, 34, 2, SSD1306_WHITE);
  display.drawLine(54, 46, 74, 46, SSD1306_WHITE);
}

void drawIdle() {
  drawEyes(16, 14, blinkState);
  display.drawLine(52, 46, 76, 46, SSD1306_WHITE);
}

void drawWarn() {
  display.fillTriangle(64, 10, 44, 50, 84, 50, SSD1306_WHITE);
  display.fillRect(62, 22, 4, 16, BLACK);
  display.fillRect(62, 42, 4, 4, BLACK);
}

void drawConfused() {
  drawEyes(14, 18, false);
  display.drawLine(48, 47, 80, 43, SSD1306_WHITE);
  display.drawLine(46, 20, 58, 16, SSD1306_WHITE);
  display.drawLine(70, 16, 82, 20, SSD1306_WHITE);
}

void drawAlert() {
  display.drawCircle(64, 32, 22, SSD1306_WHITE);
  display.fillCircle(56, 28, 4, SSD1306_WHITE);
  display.fillCircle(72, 28, 4, SSD1306_WHITE);
  display.drawCircle(64, 42, 8, SSD1306_WHITE);
}

void drawBoot() {
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(26, 24);
  display.print("BOOT");
}

void renderEmotion() {
  display.clearDisplay();
  if (currentEmotion == "HAPPY") drawHappy();
  else if (currentEmotion == "IDLE") drawIdle();
  else if (currentEmotion == "WARN") drawWarn();
  else if (currentEmotion == "CONFUSED") drawConfused();
  else if (currentEmotion == "ALERT") drawAlert();
  else drawBoot();
  display.display();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    for (;;) delay(1000);
  }
  renderEmotion();
}

void loop() {
  while (Serial.available()) {
    String s = Serial.readStringUntil('\n');
    s.trim();
    if (s.length() > 0) currentEmotion = s;
  }
  if (millis() - lastBlink > 2500) {
    blinkState = !blinkState;
    lastBlink = millis();
  }
  renderEmotion();
  delay(40);
}
