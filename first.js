import React, { Component } from "react";
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  View,
  Text,
  Button
} from "react-native";
import { BleManager, Device, Uuid } from "react-native-ble-plx";
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
      id: "99:99:01:00:10:90",
      getMessage: []
    };
    this.scanAndConnect = this.scanAndConnect.bind(this);
    this.disconnect = this.disconnect.bind(this);
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
    const byteArray = toByteArray(byteData);
    const { getMessage } = this.state;
    const hexByte = [];
    byteArray.forEach(byte => {
      s = ("0" + (byte & 0xff).toString(16)).slice(-2);
      hexByte.push(s);
    });
    getMessage[type] = hexByte;
    this.setState({ getMessage: Object.assign(getMessage, getMessage) });
    console.log(this.state.getMessage);
  }
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
      this.toHexString("0xa1", v.value);
      let secondData = postData;
      secondData[3] = 0xa2;
      if (this.state.getMessage["0xa1"]) {
        const secondCharacteristic = await this.manager.writeCharacteristicWithoutResponseForDevice(
          device.id,
          service,
          char,
          fromByteArray(secondData)
        );
        const secondResp = secondCharacteristic.read();
        secondResp.then(v => {
          console.log("0xa2", toByteArray(v.value));
          this.toHexString("0xa2", v.value);
          let thirdData = postData;
          thirdData[3] = 0xa5;
        });
      }
      if (this.state.getMessage["0xa1"] && this.state.getMessage["0xa2"]) {
        const thirdCharacteristic = await this.manager.writeCharacteristicWithoutResponseForDevice(
          device.id,
          service,
          char,
          fromByteArray(thirdData)
        );
        const thirdResp = thirdCharacteristic.read();
        thirdResp.then(async v => {
          console.log("0xa5", toByteArray(v.value));
          this.toHexString("0xa5", v.value);
        });
      }
    });
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
    let obj = {},
      deviceArr = [];
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
          .catch(error => console.log(error));
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
