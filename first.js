import React, { Component } from "react";
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  View,
  Text,
  Button
} from "react-native";
import { BleManager } from "react-native-ble-plx";
import DeviceList from "./app/deviceList";
import { fromByteArray, toByteArray } from "base64-js";
const postData = [
  0x01,
  0x00,
  0x08,
  0xa1,
  0x01,
  0x02,
  0x03,
  0x04,
  0x05,
  0x06,
  0xbf,
  0x04
];
export default class App extends Component {
  constructor() {
    super();
    this.manager = new BleManager();
    this.state = {
      info: "Arama başlamadı",
      devices: [],
      selectDeviceData: {},
      isDeviceConnected: false,
      bleStatus: false,
      writed: false,
      id: "06:73:01:00:10:90", //"99:99:01:00:10:90",
      getMessage: [],
      log: {}
    };
    this.scanAndConnect = this.scanAndConnect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    setInterval(() => {
      this.controller();
    }, 1000);
  }
  logHandler(type, text, status, deviceWrited) {
    let log = {};
    log[new Date().getTime()] = {
      type: type,
      text: text,
      status: status,
      deviceWrited: deviceWrited
    };
    this.setState({ log: log });
  }
  controller() {
    this.manager
      .isDeviceConnected(this.state.id)
      .then(v => {
        console.log(v);
        if (v) {
          this.logHandler(
            "info",
            "Cihaz ile bağlantı kuruldu",
            "success",
            this.state.writed
          );
          if (this.state.writed) {
            this.logHandler(
              "info",
              "Cihaza veriler başarılı bir şekilde yazıldı",
              "success",
              this.state.writed
            );
          }
        } else if (this.state.writed) {
          this.logHandler(
            "info",
            "Cihaza veriler başarılı bir şekilde yazıldı",
            "success",
            this.state.writed
          );
        } else if (v === false) {
          this.logHandler(
            "warning",
            "Cihaz ile olan bağlantı koptu",
            "disconnect",
            this.state.writed
          );
          this.scanAndConnect();
        }
        this.setState({ isDeviceConnected: false, writed: false });
      })
      .catch(e => {
        this.logHandler("error", e, "error", null);
      });
  }
  componentDidMount() {
    if (Platform.OS === "android" && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      ).then(result => {
        if (result === false) {
          PermissionsAndroid.requestPermission(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
          );
        }
      });
    }
    if (Platform.OS === "ios") {
      this.manager.onStateChange(state => {
        if (state === "PoweredOn") this.scanAndConnect();
      });
    } else {
      this.scanAndConnect();
    }
  }
  toHexString(type, byteData) {
    let s = "0x";
    let byteArray = toByteArray(byteData);
    const { getMessage } = this.state;
    let hexByte = [];
    byteArray.forEach(byte => {
      s = ("0" + (byte & 0xff).toString(16)).slice(-2);
      hexByte.push(s);
    });

    getMessage[type] = hexByte;
    this.setState({ getMessage: Object.assign(getMessage, getMessage) });
    console.log(this.state.getMessage);
  }
  checsumControl(byteData) {
    console.log(typeof byteData, byteData);
    let x = 0,
      s = "0x";
    for (let i = 1; i < 10 - 2; i++) {
      x += byteData[i];
    }
    byteData[10] = x;
    console.log(byteData);
    const hexByte = [];
    byteData.forEach(byte => {
      s = ("0" + (byte & 0xff).toString(16)).slice(-2);
      hexByte.push(s);
    });
    console.log(hexByte);
    return hexByte;
  }
  messageTypeController(type, data) {}
  async write(device, service, char, data) {
    let secondData = postData,
      thirdData = postData;

    const characteristic = await this.manager.writeCharacteristicWithoutResponseForDevice(
      device.id,
      service,
      char,
      fromByteArray(data)
    );
    const firstResp = characteristic.read();

    firstResp.then(async v => {
      secondData[3] = 0xa2;
      secondData = this.checsumControl(secondData);
      await this.toHexString("0xa1", v.value);
      const secondCharacteristic = await this.manager.writeCharacteristicWithoutResponseForDevice(
        device.id,
        service,
        char,
        fromByteArray(secondData)
      );
      const secondResp = secondCharacteristic.read();
      await secondResp.then(v => {
        thirdData[3] = 0xa5;
        thirdData = this.checsumControl(thirdData);
        this.toHexString("0xa2", v.value);
      });
      const thirdCharacteristic = await this.manager.writeCharacteristicWithoutResponseForDevice(
        device.id,
        service,
        char,
        fromByteArray(thirdData)
      );

      const thirdResp = thirdCharacteristic.read();
      console.log(thirdCharacteristic);
      await thirdResp.then(async v => {
        console.log(thirdData[3], toByteArray(v.value));
        await this.toHexString("0xa5", v.value);
      });
      this.setState({ writed: true });
    });
    // console.log(this.state.getMessage);
  }
  /*
        * Cihaz bağlantısını kopar
     */

  disconnect(device) {
    this.state.devices.onDisconnected((err, device) => {
      if (err) return;
      const status =
        this.manager.isDeviceConnected(device.id) ||
        !this.state.isDeviceConnected;
      this.setState({
        info: "cihaza ayrıldı " + device.name,
        isDeviceConnected: false,
        selectDeviceData: {}
      });
    });
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        // Handle error (scanning will be stopped automatically)
        this.setState({ info: "cihazlar bulunamadı", bleStatus: false });
        return false;
      }
      if (device.id !== null && device.id === this.state.id) {
        // Creating an array of devices with names
        this.setState({ bleStatus: true });
        this.manager.stopDeviceScan();
        console.log(device);
        device
          .connect()
          .then(device => {
            console.log(device);
            return device.discoverAllServicesAndCharacteristics();
          })
          .then(device => {
            console.log(device);
            return this.write(device, "aaaa", "bbbb", postData);
          })
          .catch(e => {
            this.logHandler("error", e, "error", null);
            this.setState({ writed: false });
          });
        this.setState({
          devices: device,
          isDeviceConnected: true
        });
      }
    });
  }

  render() {
    const { devices, isDeviceConnected } = this.state;
    return (
      <ScrollView>
        <View style={{ backgroundColor: "#f8f8f8" }}>
          <DeviceList
            data={devices}
            press={() =>
              isDeviceConnected ? this.disconnect() : this.connect(devices)
            }
            title={isDeviceConnected ? "Bağlantıyı kes" : "Bağlan"}
            refresh={() => this.scanAndConnect()}
            devicetitle={this.state.selectDeviceData.name}
            blestatus={this.state.bleStatus}
          />
          <Text>{this.state.info}</Text>
        </View>
      </ScrollView>
    );
  }
}
