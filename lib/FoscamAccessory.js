"use strict";

const FoscamStream = require('./FoscamStream');
const Foscam = require('foscam-client');

class FoscamAccessory {
    constructor(hap, config, log) {
        let self = this;
        const StreamController = hap.StreamController;

        self.hap = hap;
        self.log = log;

        let username = config.username || 'admin';
        let password = config.password || '';
        let port = config.port || 88;
        let uri = 'rtsp://' + username + ':' + password + '@' + config.host + ':' + port + '/';
        let gain = config.gain || 0;

        self.streamType = config.streamType || 3;

        self._foscamClient = new Foscam({
            username: username,
            password: password,
            host: config.host,
            protocol: 'http'
        });

        self.log('FoscamAccessory configured with', username, config.host, port, self.streamType);

        let mainURI = uri + 'videoMain';
        let subURI = uri + 'videoSub';

        let mainResolutions = [
            [1280, 960, 30],
            [1280, 960, 15],
            [1280, 720, 30],
            [1280, 720, 15],
            [640, 480, 30],
            [640, 480, 15],
            [640, 360, 30],
            [640, 360, 15],
            [320, 240, 30],
            [320, 240, 15],
            [320, 180, 30],
            [320, 180, 15]
        ];

        let subResolutions = [
            [1280, 720, 10],
            [640, 480, 10],
            [640, 360, 10],
            [320, 240, 10],
            [320, 180, 10]
        ];

        let audioSettings = {
            codecs: [
                {
                    type: 'OPUS',
                    samplerate: 16
                }
            ]
        };

        let videoCodec = {
            profiles: [StreamController.VideoCodecParamProfileIDTypes.MAIN],
            levels: [StreamController.VideoCodecParamLevelTypes.TYPE3_1, StreamController.VideoCodecParamLevelTypes.TYPE3_2, StreamController.VideoCodecParamLevelTypes.TYPE4_0]
        }

        let mainOptions = {
            proxy: true,
            disable_audio_proxy: true,
            srtp: false,
            video: {
                resolutions: mainResolutions,
                codec: videoCodec
            },
            audio: audioSettings
        };

        let subOptions = {
            proxy: true,
            disable_audio_proxy: true,
            srtp: false,
            video: {
                resolutions: subResolutions,
                codec: videoCodec
            },
            audio: audioSettings
        };

        self.mainSupportedBitRates = [
            4 * 1024 * 1024,
            2 * 1024 * 1024,
            1 * 1024 * 1024,
            512 * 1024,
            256 * 1024,
            200 * 1024,
            128 * 1024,
            100 * 1024
        ];

        self.subSupportedBitRates = [
            512 * 1024,
            256 * 1024,
            200 * 1024,
            128 * 1024,
            100 * 1024,
            50 * 1024,
            20 * 1024
        ];

        self.services = [];
        self.streamControllers = [];
        self.streams = [];

        self._streamControllerIdx = 0;
        self._createStreamControllers(1, mainURI, gain, mainOptions, self.setMainOptions.bind(self));
        self._createStreamControllers(1, subURI, gain, subOptions, self.setSubOptions.bind(self));

        self._infoPromise = self._foscamClient.getDevInfo().then(info => {
            self.log('Foscam Camera Info:', info);
            return info;
        });
    }

    info() {
        let self = this;
        return self._infoPromise;
    }

    closestBitRate(list, bitRate) {
        let closest = null;
        let closestDiff;
        for(let rate of list) {
            let diff = Math.abs(bitRate - rate);
            if(closest === null || closestDiff > diff) {
                closest = rate;
                closestDiff = diff;
            }
        }

        return closest;
    }

    setMainOptions(width, height, fps, bitRate) {
        let self = this;
        self.log('Requested main options:', width, height, fps, bitRate);
        return self._foscamClient.setVideoStreamParam({
            'streamType': self.streamType,
            'resolution': self.heightToFoscamResolution(height),
            'bitRate': self.closestBitRate(self.mainSupportedBitRates, bitRate),
            'frameRate': fps,
            'GOP': fps,
            'isVBR': true
        }).then(() => {
            self.log('Set main parameters, requesting set type.');
            return self._foscamClient.setMainVideoStreamType(self.streamType);
        });
    }

    setSubOptions(width, height, fps, bitRate) {
        let self = this;
        self.log('Requested sub options:', width, height, fps, bitRate);
        return self._foscamClient.setSubVideoStreamParam({
            'streamType': self.streamType,
            'resolution': self.heightToFoscamResolution(height),
            'bitRate': self.closestBitRate(self.subSupportedBitRates, bitRate),
            'frameRate': fps,
            'GOP': fps,
            'isVBR': true
        }).then(() => {
            // Work-around for lack of setSubVideoStreamType in foscam-client.
            self.log('Set sub parameters, requesting set type.');
            return self._foscamClient.get('setSubVideoStreamType', {'streamType': self.streamType});
        });
    }

    heightToFoscamResolution(height) {
        switch(height) {
            case 960:
                return 6;
            case 720:
                return 0;
            case 480:
                return 1;
            case 360:
                return 3;
            case 240:
                return 2;
            case 180:
                return 4;
        }
    }

    _createStreamControllers(numStreams, uri, gain, options, setOptions) {
        let self = this;
        let stream = new FoscamStream(uri, gain, setOptions, self.log);

        for(let i = 0; i < numStreams; i++) {
            var streamController = new self.hap.StreamController(self._streamControllerIdx++, options, stream);

            self.services.push(streamController.service);
            self.streamControllers.push(streamController);
        }

        self.streams.push(stream);
    }

    handleSnapshotRequest(request, callback) {
        let self = this;
        self.log('Foscam-NG: Getting snapshot.');
        self._foscamClient.snapPicture2().then(function(data) {
            self.log('Foscam-NG: Got snapshot.');
            callback(null, data);
        });
    }
}

module.exports = FoscamAccessory;
