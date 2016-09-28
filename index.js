"use strict";
var Accessory, hap, UUIDGen;

const FoscamAccessory = require('./lib/FoscamAccessory');

class FoscamPlatform {
    constructor(log, config, api) {
        let self = this;

        self.config = config;
        self.log = log;

        if (api) {
            self.api = api;

            if (api.version < 2.1) {
                throw new Error("Unexpected API version.");
            }

            self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
        }
    }

    configureAccessory(accessory) {
    }

    didFinishLaunching() {
        let self = this;
        let name = "Foscam";
        let uuid = UUIDGen.generate(name);

        let cameraAccessory = new Accessory(name, uuid, hap.Accessory.Categories.CAMERA);
        let cameraSource = new FoscamAccessory(hap, self.config, self.log);
        cameraAccessory.configureCameraSource(cameraSource);

        self.api.publishCameraAccessories("Foscam-NG", [cameraAccessory]);
    }    
}

module.exports = function(homebridge) {
    Accessory = homebridge.platformAccessory;
    hap = homebridge.hap;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-foscam-ng", "Foscam-NG", FoscamPlatform, true);
}
