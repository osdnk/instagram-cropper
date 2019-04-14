import React, { RefObject } from 'react';
import { ImageURISource, Platform, View } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';

const {
  set,
  cond,
  block,
  eq,
  call,
  not,
  min,
  add,
  and,
  Value,
  spring,
  lessOrEq,
  or,
  divide,
  greaterThan,
  sub,
  event,
  multiply,
  clockRunning,
  startClock,
  timing,
  stopClock,
  decay,
  Clock,
  lessThan,
} = Animated;

const gridColor = '#6d6d6d';

class Grid extends React.Component<{ opacity: Animated.Adaptable<number> }> {
  render() {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: this.props.opacity,
        }}
      >
        <View
          style={{
            width: 0.5,
            height: '100%',
            position: 'absolute',
            left: '33%',
            backgroundColor: gridColor,
          }}
        />
        <View
          style={{
            width: 0.5,
            height: '100%',
            position: 'absolute',
            right: '33%',
            backgroundColor: gridColor,
          }}
        />
        <View
          style={{
            height: 0.5,
            width: '100%',
            position: 'absolute',
            top: '33%',
            backgroundColor: gridColor,
          }}
        />
        <View
          style={{
            height: 0.5,
            width: '100%',
            position: 'absolute',
            bottom: '33%',
            backgroundColor: gridColor,
          }}
        />
      </Animated.View>
    );
  }
}

type PickerProps = {
  source: ImageURISource,
  ratio: number,
  onPhotoResize?: (size: number[]) => any,
  zoomEnabled?: boolean,
  panEnabled?: boolean,
  gridVisible?: boolean,
  minZoom: number,
  maxZoom : number,
};

class InstagramCropper extends React.Component<PickerProps> {
  static defaultProps = {
    zoomEnabled: true,
    panEnabled: true,
    minZoom: 1,
    maxZoom : 3,
    gridVisible: true,
  }
  private readonly transX: Animated.Adaptable<number>;
  private readonly transY: Animated.Adaptable<number>;
  private readonly ratio: Animated.Value<number>;
  private readonly opacity: Animated.Value<number>;
  private readonly focalX: Animated.Value<number>;
  private readonly focalY: Animated.Value<number>;
  private readonly scale: Animated.Adaptable<number>;
  private readonly scaleMovement: Animated.Value<number>;
  private readonly dragX: Animated.Value<number>;
  private readonly dragY: Animated.Value<number>;
  private readonly panState: Animated.Value<number>;
  private readonly tapState: Animated.Value<number>;
  private readonly pinchState: Animated.Value<number>;
  private readonly handlePan: any;
  private readonly handleTap: any;
  private readonly handleOnLayout: any;
  private readonly handlePinch: any;
  private readonly photoWidth: any;
  private readonly componentWidth: any;
  private readonly componentHeight: any;
  private readonly photoHeight: any;
  private readonly distanceFromLeft: any;
  private readonly distanceFromTop: any;
  private readonly velocityX: any;
  private readonly velocityY: any;
  private readonly gridClock: Animated.Clock;

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
    this.tapState = new Value(0);
    this.opacity = new Value(0);
    this.distanceFromLeft = new Value(0);
    this.distanceFromTop = new Value(0);
    this.componentWidth = new Value(100);
    this.componentHeight = new Value(100);
    this.gridClock = new Animated.Clock();
    this.velocityX = new Animated.Value(0);
    this.velocityY = new Animated.Value(0);
    this.handlePan = event([
      {
        nativeEvent: {
          velocityY: this.velocityY,
          velocityX: this.velocityX,
          translationX: this.dragX,
          translationY: this.dragY,
          state: this.panState,
        },
      },
    ]);

    this.handleTap = event([
      {
        nativeEvent: {
          state: this.tapState,
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
        }: {
          nativeEvent: {
            layout: {
              width: number,
              height: number,
            },
          },
        },
      ) => {
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
    this.ratio = new Value(this.props.ratio);
    this.photoHeight = min(this.componentHeight, divide(this.componentWidth, this.ratio));
    this.photoWidth = min(this.componentWidth, multiply(this.componentHeight, this.ratio));
    this.distanceFromLeft =
      divide(
        sub(
          this.componentWidth,
          min(this.componentWidth, multiply(this.componentHeight, this.ratio)),
        ),
        2,
      );
    this.distanceFromTop =
      divide(
        sub(
          this.componentHeight,
          min(this.componentHeight, divide(this.componentWidth, this.ratio)),
        ),
        2,
      );

    this.scale = InstagramCropper.withBouncyLimits(
      InstagramCropper.withPreservingMultiplicativeOffset(
        this.scaleMovement, this.pinchState, this.props.minZoom, this.props.maxZoom),
      this.props.minZoom,
      this.props.maxZoom,
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
      InstagramCropper.withBouncyLimits(
        InstagramCropper.withDecaying(
          InstagramCropper.withAddingFocalDisplacement(
            InstagramCropper.withPreservingAdditiveOffset(this.dragX, this.panState, this.scale),
            sub(0.5, divide(this.focalX, this.photoWidth)),
            this.scale,
            this.photoWidth,
          ),
          this.panState,
          this.velocityX,
          wasDecayRun,
          this.scale,
        ),
        lowX,
        upX,
        this.panState,
        this.pinchState,
      );
    this.transY =
      InstagramCropper.withBouncyLimits(
        InstagramCropper.withDecaying(
          InstagramCropper.withAddingFocalDisplacement(
            InstagramCropper.withPreservingAdditiveOffset(this.dragY, this.panState, this.scale),
            sub(0.5, divide(this.focalX, this.photoHeight)),
            this.scale,
            this.photoHeight,
          ),
          this.panState,
          this.velocityY,
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
    val: Animated.Adaptable<number>,
    minBound: Animated.Adaptable<number>,
    maxBound: Animated.Adaptable<number>,
    state: Animated.Adaptable<number>,
    anotherState?: Animated.Adaptable<number>,
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
                  InstagramCropper.runSpring(
                    springClock,
                    limitedVal,
                    minBound,
                    flagWasRunSpring,
                  ),
                ),
                cond(
                  greaterThan(limitedVal, maxBound),
                  set(
                    limitedVal,
                    InstagramCropper.runSpring(
                      springClock,
                      limitedVal,
                      maxBound,
                      flagWasRunSpring,
                    )),
                  [
                    cond(not(flagWasRunSpring), set(limitedVal, add(limitedVal, sub(val, prev)))),
                    set(prev, val),
                  ],
                ),
              ),
            ],
            [
              set(limitedVal, add(limitedVal, sub(val, prev))),
              cond(
                and(lessThan(limitedVal, minBound), lessThan(val, prev)),
                [
                  // revert a bit
                  set(limitedVal, add(limitedVal, divide(sub(prev, val), 1.2))),
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
    clock: Animated.Clock,
    value: Animated.Adaptable<number>,
    dest: Animated.Adaptable<number>,
    wasStartedFromBegin: Animated.Value<number>,
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

  private static runTiming(
    clock: Animated.Clock,
    value: Animated.Adaptable<number>,
    dest: Animated.Adaptable<number>,
  ) {
    const state = {
      finished: new Value(0),
      position: new Value(0),
      frameTime: new Value(0),
      time: new Value(0),
    };

    const config = {
      toValue: new Value(0),
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
    };

    return [
      cond(clockRunning(clock), 0, [
        set(state.finished, 0),
        set(state.frameTime, 0),
        set(state.time, 0),
        set(state.position, value),
        set(config.toValue, dest),
        startClock(clock),
      ]),
      timing(clock, state, config),
      cond(state.finished, stopClock(clock)),
      state.position,
    ];
  }

  private static runDecay(
    clock: Animated.Clock,
    value: Animated.Adaptable<number>,
    velocity: Animated.Adaptable<number>,
    wasStartedFromBegin: Animated.Value<number>,
  ): Animated.Adaptable<number> {
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
  ): Animated.Adaptable<number> {
    const valDecayed = new Value(0);
    const offset = new Value(0);
    const prevState = new Value(0);
    const decayClock = new Clock();
    return block([
      cond(
        eq(state, State.END),
        set(
          valDecayed,
          InstagramCropper.runDecay(
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
                  ios: divide(sub(drag, prev), scale), // TODO wtf
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

  pinch: RefObject<PinchGestureHandler> = React.createRef();
  pan: RefObject<PanGestureHandler> = React.createRef();
  tap: RefObject<TapGestureHandler> = React.createRef();

  render() {
    return (
      <View style={{ width: 350, height: 350, overflow: 'hidden', backgroundColor: '#BBB' }}>
        {this.props.onPhotoResize &&
          <Animated.Code
            exec={
              call(
                [
                  this.scale,
                  this.transX,
                  this.transY,
                ],
                this.props.onPhotoResize,
              )
            }
          />
        }
        <PinchGestureHandler
          enabled={this.props.zoomEnabled}
          shouldCancelWhenOutside={false}
          ref={this.pinch}
          simultaneousHandlers={[this.pan, this.tap]}
          onGestureEvent={this.handlePinch}
          onHandlerStateChange={this.handlePinch}
        >
          <Animated.View>
            <PanGestureHandler
              enabled={this.props.panEnabled}
              ref={this.pan}
              simultaneousHandlers={[this.pinch, this.tap]}
              onGestureEvent={this.handlePan}
              onHandlerStateChange={this.handlePan}
            >
              <Animated.View>
                <TapGestureHandler
                  enabled={this.props.gridVisible}
                  maxDurationMs={10000000}
                  ref={this.tap}
                  simultaneousHandlers={[this.pinch, this.pan]}
                  onHandlerStateChange={this.handleTap}
                >
                  <Animated.View>
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
                    <Grid
                      opacity={
                        block([
                          cond(
                            1,
                            cond(
                              or(eq(this.tapState, State.BEGAN), eq(this.tapState, State.ACTIVE)),
                              set(
                                this.opacity,
                                InstagramCropper.runTiming(this.gridClock, this.opacity, 1),
                              ),
                              set(
                                this.opacity,
                                InstagramCropper.runTiming(this.gridClock, this.opacity, 0),
                              ),
                            ),
                          ),
                          this.opacity,
                        ])}
                    />
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </View>
    );
  }
}

type WrapperState = {
  val: number,
};

export default class InstagramPickerWrapper extends React.Component<PickerProps, WrapperState> {
  state = {
    val: 0,
  };

  static getDerivedStateFromProps(props: PickerProps, state: WrapperState) {
    return {
      val: state.val + 1,
    };
  }

  render() {
    return (
      <InstagramCropper
        {...this.props}
        key={this.state.val}
      />
    );
  }
}
