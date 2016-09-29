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
            "gain": 6,
            "motionDetector": {
                "schedule": {
                    "monday": [["0:00", "24:00"]],
                    "tuesday": [["0:00", "24:00"]],
                    "wednesday": [["0:00", "24:00"]],
                    "thursday": [["0:00", "24:00"]],
                    "friday": [["0:00", "24:00"]],
                    "saturday": [["0:00", "24:00"]],
                    "sunday": [["0:00", "24:00"]]
                },

                "areas": [
                    [[0, 0], [9, 9]]
                ]
            }
        }

```

Fields:

* "platform": Must always be "Foscam-NG" (required)
* "username": The username for your Foscam camera. Manufacturer default is "admin". (required)
* "password": The password for your Foscam camera. Manufacturer default for "admin" is "". (required)
* "host": The local IP address of your camera. (required)
* "port": The RTP and HTTP port for the camera. Manufacturer default is 88. (required)
* "gain": Foscam audio output tends to be on the quiet side. This is the gain in decibels to boost the audio. Use 0 for no gain. (required)
* "streamType": Video setting to overwrite for iOS's dynamic configuration. Defaults to 3 ("user-defined"). (optional)
* "maxMainStreams": Number of simultaneous streams to allow from the camera's "main" stream. Defaults to 2. (optional)
* "maxSubStreams": Number of simultaneous streams to allow from the camera's "main" stream. Defaults to 2. (optional)

