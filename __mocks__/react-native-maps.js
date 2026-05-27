import React from 'react';
import { View } from 'react-native';

const MapView = React.forwardRef(({ children, ...props }, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: jest.fn(),
    animateCamera: jest.fn(),
    fitToCoordinates: jest.fn(),
    fitToSuppliedMarkers: jest.fn(),
  }));
  return <View {...props}>{children}</View>;
});

const Marker = ({ children, ...props }) => <View {...props}>{children}</View>;
const Callout = ({ children, ...props }) => <View {...props}>{children}</View>;
const Circle = props => <View {...props} />;
const Polyline = props => <View {...props} />;

MapView.Marker = Marker;
MapView.Callout = Callout;
MapView.Circle = Circle;
MapView.Polyline = Polyline;

export default MapView;
export { Marker, Callout, Circle, Polyline };
