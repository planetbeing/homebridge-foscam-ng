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
* "motionDetector": Add if motion detector feature is desired. Note that enabling this will overwrite any existing motion detection settings on the Foscam. (optional)
  * "schedule": If not present, motion detector is always active. If present, specifies the days and time intervals during which the motion detector is active.
    Each day is a list of one or more time intervals. Time intervals are a list with two items, a start time (inclusive) and a stop time (exclusive). All time
    is in 24 hour format, with 24:00 denoting the end of the day. Due to Foscam limitations, minutes are only honored in 30 minute increments. (optional)
  * "areas": If not present, the motion detector will work on the entire image. If present, specifies the areas of the image the motion detector should pay attention to.
    This is a list of rectangular areas. Each rectangular area is a list with two items, a top left coordinate and a bottom right coordinate. Each coordinate is a list
    with two items, an x coordinate and a y coordinate. Foscam divides the image into a 10x10 grid, with the top left grid being 0, 0 and the bottom right being 9, 9.
  * "triggerInterval": Time in seconds (5-15) to consider the motion detection triggered after detecting a motion, suppressing additional detection of motion during that
    time period. Defaults to 5. (optional)
  * "sensitivity": 0 for low, 1 for normal, 2 for high, 3 for lower, 4 for lowest. Defaults to 1. (optional)

