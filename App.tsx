import React, {RefObject} from 'react';
import { StyleSheet, Text, View, Image, ImageURISource } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const {
  set,
  cond,
  onChange,
  block, eq,
  greaterOrEq,
  not,
  defined,
  max,
  add,
  call,
  and,
  Value,
  spring,
  lessOrEq,
  or,
  divide,
  greaterThan,
  sub,
  event,
  diff,
  multiply,
  clockRunning,
  startClock,
  stopClock,
  decay,
  Clock,
  lessThan,
} = Animated;

/*interface ImageURISource {
  uri?: string;
  bundle?: string;
  method?: string;
  headers?: { [key: string]: string };
  cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached';
  body?: string;
  width?: number;
  height?: number;
  scale?: number;
}*/
type PickerProps = {
  source: ImageURISource,
  ratio: number,
};

type PickerState = {
  transX: Animated.Adaptable<number>,
  transY: Animated.Adaptable<number>,
  scale: Animated.Value<number>,
  dragX: Animated.Value<number>,
  dragY: Animated.Value<number>,
  panState: Animated.Value<number>,
};

class InstagramPicker extends React.Component<PickerProps, PickerState> {
  private readonly transX: Animated.Adaptable<number>;
  private readonly transY: Animated.Adaptable<number>;
  private readonly focalX: Animated.Value<number>;
  private readonly focalY: Animated.Value<number>;
  private readonly scale: Animated.Adaptable<number>;
  private readonly scaleMovement: Animated.Value<number>;
  private readonly dragX: Animated.Value<number>;
  private readonly dragY: Animated.Value<number>;
  private readonly panState: Animated.Value<number>;
  private readonly pinchState: Animated.Value<number>;
  private readonly handlePan: any;
  private readonly handleOnLayout: any;
  private readonly handlePinch: any;
  private readonly photoWidth: any;
  private readonly componentWidth: any;
  private readonly componentHeight: any;
  private readonly photoHeight: any;
  private readonly distanceFromLeft: any;
  private readonly distanceFromTop: any;
  constructor(props: PickerProps) {
    super(props);
    this.dragX = new Value(0);
    this.dragY = new Value(0);
    this.focalX = new Value(0);
    this.focalY = new Value(0);
    this.panState = new Value(0);
    this.pinchState = new Value(0);
    this.scaleMovement = new Value(1);
    this.photoHeight = new Value(1);
    this.photoWidth = new Value(1);
    this.distanceFromLeft = new Value(0);
    this.distanceFromTop = new Value(0);
    this.componentWidth = new Value(0);
    this.componentHeight = new Value(0);
    const velocityX = new Animated.Value(0);
    const velocityY = new Animated.Value(0);
    this.handlePan = event([
      {
        nativeEvent: {
          velocityY,
          velocityX,
          translationX: this.dragX,
          translationY: this.dragY,
          state: this.panState,
        },
      },
    ]);

    this.handleOnLayout =
      (
        {
          nativeEvent: {
            layout: {
              width,
              height,
            },
          },
        } : {
          nativeEvent: {
            layout: {
              width : number,
              height : number,
            },
          },
        },
    ) => {
        this.photoHeight.setValue(Math.min(height, width / this.props.ratio));
        this.photoWidth.setValue(Math.min(width, height * this.props.ratio));
        this.distanceFromLeft.setValue((width - Math.min(width, height * this.props.ratio)) / 2);
        this.distanceFromTop.setValue((height - Math.min(height, width / this.props.ratio)) / 2);
        this.componentHeight.setValue(height);
        this.componentWidth.setValue(width);
      };

    this.handlePinch = event([
      {
        nativeEvent: {
          scale: this.scaleMovement,
          state: this.pinchState,
          focalX: this.focalX,
          focalY: this.focalY,
        },
      },
    ]);
    this.scale = InstagramPicker.withLimits(
      InstagramPicker.withPreservingMultiplicativeOffset(
      this.scaleMovement, this.pinchState),
      0.9,
      3,
      this.pinchState,
    )
    const isUnderSizedX = lessOrEq(this.scale, divide(this.componentWidth, this.photoWidth));
    const isUnderSizedY = lessOrEq(this.scale, divide(this.componentHeight, this.photoHeight));

    const lowX = cond(
      isUnderSizedX,
      0,
      sub(divide(this.componentWidth, this.scale, 2), divide(this.photoWidth, 2)),
    );

    const lowY = cond(
      isUnderSizedY,
      0,
      sub(divide(this.componentHeight, this.scale, 2), divide(this.photoHeight, 2)),
    );

    const upX = cond(
      isUnderSizedX,
      lowX,
      divide(sub(this.photoWidth, divide(this.componentWidth, this.scale)), 2),
    );

    const upY = cond(
      isUnderSizedY,
      0,
      divide(sub(this.photoHeight, divide(this.componentHeight, this.scale)), 2),
    );

    const wasDecayRun = new Animated.Value(0);

    this.transX =
      InstagramPicker.withLimits(
        InstagramPicker.withDecaying(
          InstagramPicker.withAddingFocalDisplacement(
            InstagramPicker.withPreservingAdditiveOffset(this.dragX, this.panState),
            sub(0.5,  divide(this.focalX, this.photoWidth)),
            this.scale,
            this.photoWidth,
          ),
          this.panState,
          velocityX,
          wasDecayRun,
        ),
        lowX,
        upX,
        this.panState,
      );
    this.transY =
      InstagramPicker.withLimits(
        InstagramPicker.withDecaying(
          InstagramPicker.withAddingFocalDisplacement(
            InstagramPicker.withPreservingAdditiveOffset(this.dragY, this.panState),
            sub(0.5,  divide(this.focalX, this.photoHeight)),
            this.scale,
            this.photoHeight,
          ),
          this.panState,
          velocityY,
          wasDecayRun,
        ),
        lowY,
        upY,
        this.panState,
      );
  }

  /*static getDerivedStateFromProps(props: PickerProps, state: PickerState | null) : PickerState {
    const dragX = (state && state.dragX) || new Value(0);
    const dragY = (state && state.dragY) || new Value(0);
    const panState = (state && state.panState) || new Value(0);
    const transX = InstagramPicker.withPreservingAdditiveOffset(dragX, panState);
    const transY = InstagramPicker.withPreservingAdditiveOffset(dragY, panState);
    return state;
  }*/

  private static runDecay(
    clock : Animated.Clock,
    value : Animated.Adaptable<number>,
    velocity: Animated.Value<number>,
    wasStartedFromBegin : Animated.Value<number>,
  ) : Animated.Adaptable<number> {
    const state = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    }

    const wasJustStarted = new Value(0);

    const config = { deceleration: 0.98 }

    return [
      set(wasJustStarted, 0),
      cond(or(clockRunning(clock), wasStartedFromBegin), 0, [
        set(state.finished, 0),
        set(state.velocity, velocity),
        set(state.position, value),
        set(state.time, 0),
        startClock(clock),
        set(wasJustStarted, 1),
      ]),
      cond(clockRunning(clock), decay(clock, state, config)),
      cond(state.finished, [
        cond(and(clockRunning(clock), not(wasJustStarted)), set(wasStartedFromBegin, 1)),
        stopClock(clock),
      ]),
      state.position,
    ];
  }

  private static withDecaying(
    drag: Animated.Adaptable<number>,
    state: Animated.Adaptable<number>,
    velocity: Animated.Value<number>,
    wasStartedFromBegin: Animated.Value<number>,
  ) : Animated.Adaptable<number> {
    const valDecayed = new Value(0);
    const offset = new Value(0);
    const prevState = new Value(0)
    const decayClock = new Clock();
    return block([
      cond(
        eq(state, State.END),
        set(
          valDecayed,
          InstagramPicker.runDecay(
            decayClock,
            add(drag, offset),
            velocity,
            wasStartedFromBegin,
          ),
        ),
        [
          stopClock(decayClock),
          cond(or(eq(state, State.BEGAN), and(eq(prevState, State.END), eq(state, State.ACTIVE))), [
            set(wasStartedFromBegin, 0),
            set(offset, sub(valDecayed, drag)),
          ]),
          set(prevState, state),
          set(valDecayed, add(drag, offset)),
        ],
      ),
      valDecayed,
    ]);
  }

  private static withPreservingAdditiveOffset
  (drag: Animated.Value<number>, state: Animated.Value<number>)
    : Animated.Adaptable<number> {
    const prev = new Value(0);
    const valWithPreservedOffset = new Value(0);
    return block(
      [
        cond(
          eq(state, State.BEGAN),
          set(prev, 0),
          [
            set(valWithPreservedOffset, add(valWithPreservedOffset, sub(drag, prev))),
            set(prev, drag),
          ],
        ),
        valWithPreservedOffset,
      ],
    );
  }

  private static withAddingFocalDisplacement
  (init: Animated.Adaptable<number>,
   diff: Animated.Adaptable<number>,
   scale: Animated.Adaptable<number>,
   size: Animated.Value<number>)
    : Animated.Adaptable<number> {
    const prevScale = new Value(1);
    const valWithFocalDisplacement = new Value(0);
    return block(
      [
        set(
          valWithFocalDisplacement,
          add(
            valWithFocalDisplacement,
            divide(multiply(diff, sub(scale, prevScale), size), scale, scale),
          ),
        ),
        set(prevScale, scale),
        add(init, valWithFocalDisplacement),
      ],
    );
  }

  private static withPreservingMultiplicativeOffset
  (val: Animated.Value<number>, state: Animated.Value<number>)
    : Animated.Adaptable<number> {
    const prev = new Animated.Value(1)
    const valWithPreservedOffset = new Animated.Value(1)
    return block([
      cond(
        eq(state, State.BEGAN),
        set(prev, 1),
        [
          set(valWithPreservedOffset, multiply(valWithPreservedOffset, divide(val, prev))),
          set(prev, val),
        ],
      ),
      valWithPreservedOffset,
    ]);
  }

  private static withLimits(
    val: Animated.Adaptable<number>,
    min: Animated.Adaptable<number>,
    max: Animated.Adaptable<number>,
    state: Animated.Value<number>) {
    const offset = new Animated.Value(0);
    const offsetedVal = add(offset, val);
    return block([
      cond(
        eq(state, State.BEGAN),
        [
          cond(
            lessThan(offsetedVal, min),
            set(offset, sub(min, val))),
          cond(
            greaterThan(offsetedVal, max),
            set(offset, sub(max, val))),
        ]),
      cond(
        lessThan(offsetedVal, min),
        min,
        cond(
          greaterThan(offsetedVal, max),
          max,
          offsetedVal,
        ),
      ),
    ]);
  }

  pinch : RefObject<PinchGestureHandler> = React.createRef();
  pan : RefObject<PanGestureHandler> = React.createRef();
  render() {
    return (
      <View style={{ width: 350, height: 350, overflow: 'hidden', backgroundColor: '#BBB' }}>
        <PinchGestureHandler
          ref={this.pinch}
          simultaneousHandlers={this.pan}
          onGestureEvent={this.handlePinch}
          onHandlerStateChange={this.handlePinch}
        >
        <Animated.View>
        <PanGestureHandler
          ref={this.pan}
          simultaneousHandlers={this.pinch}
          onGestureEvent={this.handlePan}
          onHandlerStateChange={this.handlePan}
        >
          <Animated.Image
            onLayout={this.handleOnLayout}
            style={{
              width: '100%',
              height: '100%',
              transform: [
                { scale: this.scale },
                { translateX: this.transX },
                { translateY: block([
                    // call([this.distanceFromTop, this.distanceFromLeft, this.photoHeight, this.photoWidth], console.warn),
                    this.transY]) },
              ],
            }}
            resizeMode='contain'
            source={this.props.source}
          />
        </PanGestureHandler>
        </Animated.View>
        </PinchGestureHandler>
      </View>
    );
  }
}

type AppState = {
  ratio: number,
  photo: ImageURISource,
};

export default class App extends React.Component<{}, AppState> {
  constructor(props : {}) {
    super(props);
    const photo = require('./assets/kuce.jpg');
    const { width, height } = Image.resolveAssetSource(photo);
    this.state = {
      ratio: width / height,
      photo: require('./assets/kuce.jpg'),
    };
  }
  render() {
    console.warn(this.state.ratio)
    return (
      <View style={styles.container}>
        <InstagramPicker
          ratio={this.state.ratio}
          source={this.state.photo}
        />
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
