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

        self._foscamClient = new Foscam({
            username: username,
            password: password,
            host: config.host,
            protocol: 'http'
        });

        let mainURI = uri + 'videoMain';
        let subURI = uri + 'videoSub';

        let options = {
            proxy: true,
            disable_audio_proxy: true,
            srtp: false,
            video: {
                resolutions: [
                    [1920, 1080, 30],
                    [1920, 1080, 15],
                    [1280, 960, 30],
                    [1280, 960, 15],
                    [1280, 720, 30],
                    [1280, 720, 15],
                    [1024, 768, 30],
                    [1024, 768, 15],
                    [640, 480, 30],
                    [640, 480, 15],
                    [640, 360, 30],
                    [640, 360, 15],
                    [480, 360, 30],
                    [480, 360, 15],
                    [480, 270, 30],
                    [480, 270, 15],
                    [320, 240, 30],
                    [320, 240, 15],
                    [320, 180, 30],
                    [320, 180, 15]
                ],
                codec: {
                    profiles: [StreamController.VideoCodecParamProfileIDTypes.MAIN],
                    levels: [StreamController.VideoCodecParamLevelTypes.TYPE3_1, StreamController.VideoCodecParamLevelTypes.TYPE3_2, StreamController.VideoCodecParamLevelTypes.TYPE4_0]
                }
            },
            audio: {
                codecs: [
                    {
                        type: 'OPUS',
                        samplerate: 16
                    }
                ]
            }
        };

        self.services = [];
        self.streamControllers = [];
        self.streams = [];

        self._streamControllerIdx = 0;
        self._createStreamControllers(1, mainURI, gain, options);
        self._createStreamControllers(1, subURI, gain, options);

        self._infoPromise = self._foscamClient.getDevInfo().then(info => {
            self.log('Foscam Camera Info:', info);
            return info;
        });
    }

    info() {
        let self = this;
        return self._infoPromise;
    }

    _createStreamControllers(numStreams, uri, gain, options) {
        let self = this;
        let stream = new FoscamStream(uri, gain, self.log);

        for(let i = 0; i < numStreams; i++) {
            var streamController = new self.hap.StreamController(self._streamControllerIdx++, options, stream);

            self.services.push(streamController.service);
            self.streamControllers.push(streamController);
        }

        self.streams.push(stream);
    }

    handleSnapshotRequest(request, callback) {
        let self = this;
        self._foscamClient.snapPicture2().then(function(data) {
            callback(null, data);
        });
    }
}

module.exports = FoscamAccessory;
