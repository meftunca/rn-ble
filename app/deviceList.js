import React, { Component } from 'react';
import {
  Container,
  Header,
  Content,
  List,
  ListItem,
  Text,
  Button,
  Icon,
  Left,
  Picker,
  Body,
  Title,
  Right,
} from 'native-base';


type Props = {};
export default class DeviceList extends Component<Props> {
    state = {
      modalVisible: false,
    };

    setModalVisible(visible) {
      this.setState({ modalVisible: visible });
    }

    render() {
      const { data, press } = this.props;
      return (
        <Container>
          <Header>
            <Left>
              <Icon type="FontAwesome" name="bluetooth" style={{ color: 'white' }} />
            </Left>
            <Body>
              <Text style={{ color: '#fff' }}>
                {this.props.devicetitle || 'Cihazlar'}
              </Text>
            </Body>
            <Right>
              <Button iconLeft transparent white onPress={this.props.refresh}>
                <Icon name="refresh" />
              </Button>
            </Right>
          </Header>
          <Content>
            <List>
              {
                <ListItem>
                  <Left>
                    <Text>
                      {data.localName}
                    </Text>
                  </Left>

                  <Button onPress={this.props.press} bordered small primary>
                    <Text>
                      {this.props.title}
                    </Text>
                  </Button>
                </ListItem>
                        }
            </List>
          </Content>
        </Container>
      );
    }
}
