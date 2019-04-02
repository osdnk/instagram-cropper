import React, { RefObject } from 'react';
import { StyleSheet, Text, View, Image, ImageURISource, Platform } from 'react-native';
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
  sqrt,
  min,
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
    this.scale = InstagramPicker.withBouncyLimits(
      InstagramPicker.withPreservingMultiplicativeOffset(
      this.scaleMovement, this.pinchState, 1, 3),
      1,
      3,
      this.pinchState,
    );
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
      InstagramPicker.withBouncyLimits(
        InstagramPicker.withDecaying(
          InstagramPicker.withAddingFocalDisplacement(
            InstagramPicker.withPreservingAdditiveOffset(this.dragX, this.panState, this.scale),
            sub(0.5,  divide(this.focalX, this.photoWidth)),
            this.scale,
            this.photoWidth,
          ),
          this.panState,
          velocityX,
          wasDecayRun,
          this.scale,
        ),
        lowX,
        upX,
        this.panState,
        this.pinchState,
      );
    this.transY =
      InstagramPicker.withBouncyLimits(
        InstagramPicker.withDecaying(
          InstagramPicker.withAddingFocalDisplacement(
            InstagramPicker.withPreservingAdditiveOffset(this.dragY, this.panState, this.scale),
            sub(0.5,  divide(this.focalX, this.photoHeight)),
            this.scale,
            this.photoHeight,
          ),
          this.panState,
          velocityY,
          wasDecayRun,
          this.scale,
        ),
        lowY,
        upY,
        this.panState,
        this.pinchState,
      );
  }

  private static withBouncyLimits(
    val : Animated.Adaptable<number>,
    minBound : Animated.Adaptable<number>,
    maxBound : Animated.Adaptable<number>,
    state : Animated.Adaptable<number>,
    anotherState? : Animated.Adaptable<number>,
  ) {
    const prev = new Animated.Value(0);
    const limitedVal = new Animated.Value(0);
    const flagWasRunSpring = new Animated.Value(0);
    const springClock = new Clock();
    return block([
      cond(
        or(
          eq(state, State.BEGAN),
          anotherState ?
            and(eq(state, State.END), eq(anotherState, State.ACTIVE)) : 0),
        [
          set(prev, val),
          set(flagWasRunSpring, 0),
          stopClock(springClock),
        ],
        [
          cond(
            eq(state, State.END),
            [
              cond(
                lessThan(limitedVal, minBound),
                set(
                  limitedVal,
                  InstagramPicker.runSpring(
                    springClock,
                    limitedVal,
                    minBound,
                    flagWasRunSpring,
                  ),
                ),
              ),
              cond(
                greaterThan(limitedVal, maxBound),
                set(
                  limitedVal,
                  InstagramPicker.runSpring(
                    springClock,
                    limitedVal,
                    maxBound,
                    flagWasRunSpring,
                  )),
              ),
            ],
            [
              set(limitedVal, add(limitedVal, sub(val, prev))),
              cond(
                and(lessThan(limitedVal, minBound), lessThan(val, prev)),
                [
                  // revert a bit
                  set(limitedVal, add(limitedVal, divide(sub(prev, val), 1.2)),),
                ],
              ),
              cond(
                and(greaterThan(limitedVal, maxBound), greaterThan(val, prev)),
                [
                  // revert a bit
                  set(limitedVal, add(limitedVal, divide(sub(prev, val), 1.2))),
                ],
              ),
              set(prev, val),
            ],
          ),
        ]),
      limitedVal,
    ]);
  }
  private static runSpring(
    clock : Animated.Clock,
    value : Animated.Adaptable<number>,
    dest: Animated.Adaptable<number>,
    wasStartedFromBegin : Animated.Value<number>,
    ) {
    const state = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    const wasJustStarted = new Value(0);

    const config = {
      damping: 40,
      mass: 1,
      stiffness: 121.6,
      overshootClamping: true,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
      toValue: new Value(0),
    };
    return [
      set(wasJustStarted, 0),
      cond(or(clockRunning(clock), wasStartedFromBegin), 0, [
        set(state.finished, 0),
        set(state.position, value),
        set(config.toValue, dest),
        startClock(clock),
        set(wasJustStarted, 1),
      ]),
      cond(clockRunning(clock), spring(clock, state, config)),
      cond(state.finished, [
        cond(and(clockRunning(clock), not(wasJustStarted)), set(wasStartedFromBegin, 1)),
        stopClock(clock),
      ]),
      state.position,
    ];
  }

  private static runDecay(
    clock : Animated.Clock,
    value : Animated.Adaptable<number>,
    velocity: Animated.Adaptable<number>,
    wasStartedFromBegin : Animated.Value<number>,
  ) : Animated.Adaptable<number> {
    const state = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    const wasJustStarted = new Value(0);

    const config = { deceleration: 0.98 };

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
    scale: Animated.Adaptable<number>,
  ) : Animated.Adaptable<number> {
    const valDecayed = new Value(0);
    const offset = new Value(0);
    const prevState = new Value(0);
    const decayClock = new Clock();
    return block([
      cond(
        eq(state, State.END),
        set(
          valDecayed,
          InstagramPicker.runDecay(
            decayClock,
            add(drag, offset),
            divide(velocity, scale),
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
  (drag: Animated.Value<number>, state: Animated.Value<number>, scale: Animated.Adaptable<number>)
    : Animated.Adaptable<number> {
    const prev = new Value(0);
    const valWithPreservedOffset = new Value(0);
    return block(
      [
        cond(
          eq(state, State.BEGAN),
          set(prev, 0),
          [
            set(
              valWithPreservedOffset,
              add(
                valWithPreservedOffset,
                Platform.select({
                  ios: sub(drag, prev),
                  android: divide(sub(drag, prev), scale),
                }),
            )),
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
  (val: Animated.Value<number>,
   state: Animated.Value<number>,
   min: Animated.Adaptable<number>,
   max: Animated.Adaptable<number>,
   )
    : Animated.Adaptable<number> {
    if (Platform.OS === 'android') {
      return this.withPreservingMultiplicativeOffsetAndroid(val, state, min, max);
    }
    const offset = new Animated.Value(1);
    const valWithPreservedOffset = new Animated.Value(1);
    return block([
      cond(
        eq(state, State.BEGAN),
        [
          cond(greaterThan(valWithPreservedOffset, max), set(valWithPreservedOffset, max)),
          cond(lessThan(valWithPreservedOffset, min), set(valWithPreservedOffset, min)),
          set(offset, valWithPreservedOffset),
        ],
      ),
      set(valWithPreservedOffset, multiply(offset, val)),
      valWithPreservedOffset,
    ]);
  }

  private static withPreservingMultiplicativeOffsetAndroid
  (val: Animated.Value<number>,
   state: Animated.Value<number>,
   min: Animated.Adaptable<number>,
   max: Animated.Adaptable<number>,
  )
    : Animated.Adaptable<number> {
    const offset = new Animated.Value(1);
    const init = new Animated.Value(0);
    const valWithPreservedOffset = new Animated.Value(1);
    return block([
      cond(
        eq(state, State.BEGAN),
        [
          cond(greaterThan(valWithPreservedOffset, max), set(valWithPreservedOffset, max)),
          cond(lessThan(valWithPreservedOffset, min), set(valWithPreservedOffset, min)),
          set(offset, valWithPreservedOffset),
          set(init, 0),
        ],
        [
          cond(eq(init, 0), set(init, val)),
          set(valWithPreservedOffset, multiply(offset, divide(val, init))),
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
          shouldCancelWhenOutside={false}
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
                    { translateY: this.transY },
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
