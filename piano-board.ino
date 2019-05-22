#include <WiFi.h>
#include <PubSubClient.h>

// Wifi Config
const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";

// MQTT Config
const char* mqtt_url = "mqtt.tingg.io";
const int mqtt_port = 1883;

// Thing Config
const char* thing_id = "your-piano-thing-id";
const char* key = "your-piano-thing-key";
const char* username = "thing";

// Topics Config
const char* topic = "note"; // Resource name from the platform

WiFiClient wifiClient;
PubSubClient client(wifiClient);

// Vars
char buf[12];

void setup_wifi() {
  delay(10);
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.print("WiFi connected on IP address: ");
  Serial.println(WiFi.localIP());
}


bool mqtt_connect() {
  Serial.print("Attempting MQTT connection...");
  if (client.connect(thing_id, username, key)) {
    Serial.println("connected");
    return true;
  } else {
    Serial.print("failed, state: ");
    Serial.println(client.state());
    return false;
  }
}

void reconnect() {
  int connectionAttempts = 0;
  while (!client.connected()) {
    connectionAttempts++;

    // WiFi status: https://github.com/espressif/arduino-esp32/blob/a59eafbc9dfa3ce818c110f996eebf68d755be24/libraries/WiFi/src/WiFiType.h#L40
    Serial.printf("WiFi status: %d, connected on IP address: ", WiFi.status());
    Serial.println(WiFi.localIP());

    if (connectionAttempts > 3) {
      Serial.println("Reconnecting to wifi…");
      wifiClient.stop();
      setup_wifi();
    }

    if (!mqtt_connect()) {
      Serial.println("| try again in 5 seconds");
      delay(5000);
    }
  }
}

String message(byte* payload, unsigned int length) {
  payload[length] = '\0';
  return String((char*) payload);
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println(topic);
  String msg = message(payload, length);
}



const int RETOUCH_DELAY = 350;
const int TOUCH_TREHSHOLD = 30;

const int TOTAL_PINS = 5;
/**
 * This mapping might vary, depends how you connect your wires.
 * Adjust the mapping as needed.
 * [note1: T5, note2: T4, etc.]
 */
int PIN_MAP[TOTAL_PINS] = {T5, T4, T0, T2, T3};

unsigned long last_touched[TOTAL_PINS];
bool touch_detected[TOTAL_PINS];
int last_touched_key;


void touch_interrupt_handler(int i) {
  unsigned long now = millis();
  Serial.printf("DETECTED Key %d\n", i);

  // Ignore touchRead check if current key is the same as previous and RETOUCH_DELAY condition is not met.
  if (last_touched_key == i && now - RETOUCH_DELAY < last_touched[i]) {
    Serial.printf("| IGNORE same key %d\n", i);
    return;
  }

  /* There is a buggy behaviour where multiple interrupts are detected at the same time.
   * Interrupts are detected for pins that are not touched.
   * In this case discard interrupt if current pin value is not below the threshold.
   */
  if (touchRead(PIN_MAP[i]) > TOUCH_TREHSHOLD) {
    Serial.printf("| DISCARD %d\n", i);
    return;
  }

  if (now - RETOUCH_DELAY > last_touched[i]) {
    last_touched[i] =  now;
    touch_detected[i] = true;
    last_touched_key = i;
  }
}
void got_touch_0() {
  touch_interrupt_handler(0);
}
void got_touch_1() {
  touch_interrupt_handler(1);
}
void got_touch_2() {
  touch_interrupt_handler(2);
}
void got_touch_3() {
  touch_interrupt_handler(3);
}
void got_touch_4() {
  touch_interrupt_handler(4);
}


void setup() {
  Serial.begin(115200);

  setup_wifi();
  client.setServer(mqtt_url, mqtt_port);
  client.setCallback(callback);
  mqtt_connect();

  touchAttachInterrupt(PIN_MAP[0], got_touch_0, TOUCH_TREHSHOLD);
  touchAttachInterrupt(PIN_MAP[1], got_touch_1, TOUCH_TREHSHOLD);
  touchAttachInterrupt(PIN_MAP[2], got_touch_2, TOUCH_TREHSHOLD);
  touchAttachInterrupt(PIN_MAP[3], got_touch_3, TOUCH_TREHSHOLD);
  touchAttachInterrupt(PIN_MAP[4], got_touch_4, TOUCH_TREHSHOLD);

  int i;
  for (i = 0; i < TOTAL_PINS; i++) {
    touch_detected[i] = false;
    last_touched[i] = millis() + 2000;
  }

  Serial.println("END setup");
  Serial.println();
}

void loop() {
  if (!client.connected()) {
    reconnect();
    return;
  }

  unsigned long now = millis();
  int i;

  for (i = 0; i < TOTAL_PINS; i++) {
    if (touch_detected[i]) {
      touch_detected[i] = false;
      Serial.printf("SEND Key %d\n\n", i);
      sprintf(buf, "%d", i + 1);
      client.publish("note", buf);
    }
  }

  client.loop();

  delay(100);
}
