import React, { Component } from 'react';
import {
  Text,
  View,
  Button,
  ScrollView,
} from 'react-native';

type Props = {};
export default class ShowModal extends Component<Props> {
    state = {
      modalVisible: false,
    };

    setModalVisible(visible) {
      this.setState({ modalVisible: visible });
    }

    render() {
      const { data } = this.props;
      return (
        <ScrollView style={{ backgroundColor: '#e9e9e9', padding: 10, margin: 5 }}>
          <Text>
            {' '}
id:
            {data.id}
          </Text>
          <Text>
            {' '}
name:
            {data.name}
          </Text>
          <Text>
            {' '}
rssi:
            {data.rssi}
          </Text>
          <Text>
            {' '}
mtu:
            {data.mtu}
          </Text>
          <Text>
manufacturerData :
            {data.manufacturerData}
          </Text>
          <Text>
serviceData :
            {data.serviceData}
          </Text>
          <Text>
serviceUUIDs :
            {data.serviceUUIDs}
          </Text>
          <Text>
localName :
            {data.localName}
          </Text>
          <Text>
txPowerLevel :
            {data.txPowerLevel}
          </Text>
          <Text>
solicitedServiceUUIDs :
            {data.solicitedServiceUUIDs}
          </Text>
          <Text>
isConnectable :
            {data.isConnectable}
          </Text>
          <Text>
overflowServiceUUIDs :
            {data.overflowServiceUUIDs}
          </Text>
          <Button onPress={() => this.selectDevice(e)} title="Cihazı bağla" />
        </ScrollView>
      );
    }
}
