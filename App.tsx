import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InstagramCropper from './Cropper';

type AppState = {
  ratio: number,
  photo: number,
};

export default class App extends React.Component<{}, AppState> {
  photos: any[];
  constructor(props : {}) {
    super(props);
    this.photos = [
      require('./assets/kuce.jpg'),
      require('./assets/spanko.jpg'),
      require('./assets/nature.jpg'),
    ];
    const photo = this.photos[0];
    const { width, height } = Image.resolveAssetSource(photo);
    this.state = {
      ratio: width / height,
      photo: 0,
    };
  }

  change = () => {
    const photo = (this.state.photo + 1) % this.photos.length;
    const { width, height } = Image.resolveAssetSource(this.photos[photo]);
    this.setState({
      photo,
      ratio: width / height,
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <InstagramCropper
          ratio={this.state.ratio}
          source={this.photos[this.state.photo]}
        />
        <TouchableOpacity
          onPress={this.change}
        >
          <Text>
            Change
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
