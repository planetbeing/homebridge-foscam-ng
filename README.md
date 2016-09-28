# homebridge-foscam-ng

Foscam camera plugin for [Homebridge](https://github.com/nfarina/homebridge)

## Configuration

Configuration sample:

```
    "platforms": [
        {
            "platform": "Foscam-NG",
            "username": "username",
            "password": "password",
            "host": "192.168.0.121",
            "port": 88,
            "gain": 6
        }

```

Fields:

* "platform": Must always be "Foscam-NG" (required)
* "username": The username for your Foscam camera. Manufacturer default is "admin". (required)
* "password": The password for your Foscam camera. Manufacturer default for "admin" is "". (required)
* "host": The local IP address of your camera. (required)
* "port": The RTP and HTTP port for the camera. Manufacturer default is 88. (required)
* "gain": Foscam audio output tends to be on the quiet side. This is the gain in decibels to boost the audio. Use 0 for no gain. (required)

