"use strict";

const Foscam = require('foscam-client');
const RTSPClient = require('./lib/RTSPClient');
const EventEmitter = require('events').EventEmitter;
const ip = require('ip');

class FoscamStream extends EventEmitter {
    constructor(uri, controllers) {
        super();
        let self = this;

        self.streamControllers = controllers;
        self._ready = false;

        self.rtspClient = new RTSPClient(uri);

        self.rtspClient.on('sdp', function() {
            self._ready = true;
            self.emit('ready');
        });

        self.rtspClient.on('error', (err) => {
            console.log(err);
        })
    }

    ready() {
        let self = this;
        if(self._ready) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            self.once('ready', () => {
                resolve();
            });
        });
    }

    isHandlerForRequest(request) {
        let self = this;
        for(let controller of self.streamControllers) {
            if(controller.sessionIdentifier == request['sessionID'])
                return true;
        }

        return false;
    }

    prepareStream(request, callback) {
        let self = this;
        self.rtspClient.setup(self.rtspClient.video.uri, request['video']['proxy_rtp'], request['video']['proxy_rtcp']).then(function(video) {
            return self.rtspClient.setup(self.rtspClient.audio.uri, request['audio']['proxy_rtp'], request['audio']['proxy_rtcp']).then(function(audio) {
                return [video, audio];
            });
        }).then(function(settings) {
            let videoSettings = settings[0];
            let audioSettings = settings[1];
            let currentAddress = ip.address();
            let response = {
                'address': {
                    'address': currentAddress,
                    'type': ip.isV4Format(currentAddress) ? 'v4' : 'v6'
                },
                'video': {
                    'proxy_pt': self.rtspClient.video.payload,
                    'proxy_server_address': videoSettings.source,
                    'proxy_server_rtp': videoSettings.rtpPort,
                    'proxy_server_rtcp': videoSettings.rtcpPort
                },
                'audio': {
                    'proxy_pt': self.rtspClient.audio.payload,
                    'proxy_server_address': audioSettings.source,
                    'proxy_server_rtp': audioSettings.rtpPort,
                    'proxy_server_rtcp': audioSettings.rtcpPort
                }
            };

            callback(response);
        });
    }

    handleStreamRequest(request) {
        let self = this;
        let requestType = request['type'];
        if(requestType == 'start') {
            self.rtspClient.play();
        } else if(requestType == 'stop') {
            self.rtspClient.teardown();
        }
    }
}

class FoscamAccessory {
    constructor(hap, config) {
        let self = this;
        const StreamController = hap.StreamController;

        self.hap = hap;

        let username = config.username || 'admin';
        let password = config.password || '';
        let port = config.port || 88;
        let uri = 'rtsp://' + username + ':' + password + '@' + config.host + ':' + port + '/';
        
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
                        type: 'PCMU',
                        samplerate: 8
                    }
                ]
            }
        };

        self.services = [];
        self.streamControllers = [];
        self.streams = [];

        self._streamControllerIdx = 0;
        self._createStreamControllers(1, mainURI, options);
        self._createStreamControllers(1, subURI, options);
    }

    _createStreamControllers(numStreams, uri, options) {
        let self = this;
        let controllersForURI = [];
        for(let i = 0; i < numStreams; i++) {
            var streamController = new self.hap.StreamController(self._streamControllerIdx++, options, self);

            self.services.push(streamController.service);
            self.streamControllers.push(streamController);
            controllersForURI.push(streamController);
        }

        self.streams.push(new FoscamStream(uri, controllersForURI));
    }

    handleSnapshotRequest(request, callback) {
        let self = this;
        self._foscamClient.snapPicture2().then(function(data) {
            callback(null, data);
        });
    }

    streamForRequest(request) {
        let self = this;
        for(let stream of self.streams) {
            if(stream.isHandlerForRequest(request))
                return stream;                
        }

        return null;
    }

    prepareStream(request, callback) {
        let self = this;
        let stream = self.streamForRequest(request);
        stream.ready().then(() => {
            stream.prepareStream(request, callback);
        });
    }

    handleStreamRequest(request) {
        let self = this;
        let stream = self.streamForRequest(request);
        stream.ready().then(() => {
            stream.handleStreamRequest(request);
        });
    }
}

module.exports = FoscamAccessory;
