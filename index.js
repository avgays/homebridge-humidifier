var request = require("request");
var Service, Characteristic;
 
module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-humidifier", "Humidifier", myHumidifier);
};

function myHumidifier(log, config) {
  this.log = log;
  this.name = config["name"];
  this.domoUrl = config['domoUrl'];
  this.humID = config['humID'];
  this.sensorID = config['sensorID']
  this.waterID = config['waterID'];
  this.tagHum = config['tagHum'];
}

myHumidifier.prototype = {
    getServices: function () {
      let informationService = new Service.AccessoryInformation();
      informationService
        .setCharacteristic(Characteristic.Manufacturer, "AG")
        .setCharacteristic(Characteristic.Model, "MySensors Humidifier")
        .setCharacteristic(Characteristic.SerialNumber, this.humID + "-" + this.sensorID + "-" + this.waterID);
   
      let HumidifierService = new Service.HumidifierDehumidifier(this.name);

      HumidifierService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getHumidity.bind(this));
        
      HumidifierService
        .getCharacteristic(Characteristic.RotationSpeed)
        .on('get', this.getRotationSpeed.bind(this))
        .on('set', this.setRotationSpeed.bind(this))
        .setProps({
          maxValue: 99,
          minValue: 0,
          minStep: 33
        });
        
      HumidifierService
        .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
        .on('get', this.getTargetHumidy.bind(this))
        .on('set', this.setTargetHumidy.bind(this));

      HumidifierService
        .getCharacteristic(Characteristic.WaterLevel)
        .on('get', this.getWaterLevel.bind(this));

      HumidifierService
        .getCharacteristic(Characteristic.Active)
        .on('get', this.getActive.bind(this))
        .on('set', this.setActive.bind(this));

      HumidifierService
        .setCharacteristic(Characteristic.CurrentHumidifierDehumidifierState,Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING)
        .setCharacteristic(Characteristic.TargetHumidifierDehumidifierState, Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER)
        .setCharacteristic(Characteristic.LockPhysicalControls, Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED);

      this.informationService = informationService;
      this.HumidifierService = HumidifierService;
      return [informationService, HumidifierService];
    }
};


////////////////////////getHumidity
myHumidifier.prototype.getHumidity = function (callback) {
    const me = this;
    request.get({
        url: me.domoUrl + "json.htm?type=devices&rid=" + me.sensorID, //"http://192.168.1.20:8080/
        method: 'GET',
    },           
    function (error, response, body) {
      if (error) {
        me.log('STATUS: ' + response.statusCode);
        me.log(error.message);
        return callback(error);
      }
      var json = JSON.parse(body);
      var humidity = json.result[0].Humidity;
      //me.log("humidity " + humidity );
      return callback(null, humidity); 
    })
};

//////////////////////RotationSpeed
myHumidifier.prototype.getRotationSpeed = function (callback) {
  const me = this;
  request.get({
      url: me.domoUrl + "json.htm?type=devices&rid=" + me.humID, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var RotationSpeed = json.result[0].LevelInt;
    //me.log("RotationSpeed " + RotationSpeed );
    return callback(null, RotationSpeed); 
  })
};

myHumidifier.prototype.setRotationSpeed = function (RotationSpeed, callback) {
  const me = this;
  request.get({
      url: me.domoUrl + "json.htm?type=command&param=switchlight&idx=" + me.humID + "&switchcmd=Set%20Level&level=" + RotationSpeed, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var status = json.status;
    //me.log("Set RotationSpeed %s : %s", RotationSpeed, status );
    return callback(null); 
  })
};

//////////////////////Active
myHumidifier.prototype.getActive = function (callback) {
  const me = this;
  request.get({
      url: me.domoUrl + "json.htm?type=devices&rid=" + me.humID, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var Active = (json.result[0].Data==="Off")?Characteristic.Active.INACTIVE:Characteristic.Active.ACTIVE;
    
    //me.log("Active " + Active );
    return callback(null, Active); 
  })
};
myHumidifier.prototype.setActive = function (Active, callback) {
  const me = this;
  Active = (Active===Characteristic.Active.ACTIVE)?"On":"Off";
  request.get({
      url: me.domoUrl + "json.htm?type=command&param=switchlight&idx=" + me.humID + "&switchcmd=" + Active, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var status = json.status;
    //me.log("Set Active %s : %s", Active, status );
    return callback(null); 
  })
};

//////////////////////getWaterLevel
myHumidifier.prototype.getWaterLevel = function (callback) {
  const me = this;
  request.get({
      url: me.domoUrl + "json.htm?type=devices&rid=" + me.waterID, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var WaterLevel = parseInt(json.result[0].Data);
    //me.log("WaterLevel " + WaterLevel );
    return callback(null, WaterLevel); 
  })
};

/////////////////////TargetHumidy
myHumidifier.prototype.getTargetHumidy = function (callback) {
  const me = this;
  request.get({
      url: me.domoUrl + "json.htm?type=command&param=getuservariable&idx=" + me.tagHum, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var TargetHumidy = json.result[0].Value;
    //me.log("TargetHumidy " + TargetHumidy );
    return callback(null, TargetHumidy); 
  })
};

myHumidifier.prototype.setTargetHumidy = function (TargetHumidy, callback) {
  const me = this;
  request.get({
      url: me.domoUrl + "json.htm?type=command&param=updateuservariable&vname=TargetHumidy&vtype=0&vvalue=" + TargetHumidy, 
      method: 'GET',
  },           
  function (error, response, body) {
    if (error) {
      me.log('STATUS: ' + response.statusCode);
      me.log(error.message);
      return callback(error);
    }
    var json = JSON.parse(body);
    var status = json.status;
    //me.log("Set TargetHumidy %s : %s", TargetHumidy, status );
    return callback(null); 
  })
};
