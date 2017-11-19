import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Rx from 'rxjs/Rx';
import cx from 'classnames';
import MathUtils from '../utils/MathUtils';
import {createSpringObservable, Spring} from '../utils/SpringObservable';
import Person from './Person';
import cs from './CommonFriends.module.css';

export default class CommonFriends extends Component {
  static propTypes = {
    centerOffset: PropTypes.number,
    commonFriends: PropTypes.array.isRequired,
    friend: PropTypes.object,
    offsetHeight: PropTypes.number.isRequired,
    offsetWidth: PropTypes.number.isRequired,
    offsetX: PropTypes.number,
    portraitSize: PropTypes.number.isRequired
  };

  static defaultProps = {
    centerOffset: 40,
    offsetX: 40
  };

  componentDidUpdate(prevProps) {
    if (!prevProps.friend && this.props.friend) {
      this.onAnimateIn();
    }
  }

  onAnimateIn() {
    const {
      centerOffset,
      commonFriends,
      portraitSize,
      offsetHeight,
      offsetX
    } = this.props;
    const spring = new Spring({
      fromValue: 0,
      toValue: 1
    });
    const {scrollTop} = this.rootNode.parentNode;

    const commonFriendsBaseOrigin = commonFriends.map((friend, i) => {
      const y =
        i % 2 === 0
          ? offsetHeight / 2 - centerOffset
          : offsetHeight / 2 + centerOffset;
      const x = i * (portraitSize + offsetX) + offsetX + portraitSize / 2;
      return {x, y};
    });

    const spring$ = createSpringObservable(spring);

    const friendOrigin$ = spring$.map(springValue =>
      this.mapSpringToFriendOrigin(springValue, scrollTop)
    );

    friendOrigin$.subscribe(origin =>
      this.onUpdateFriend(this.friendNode, origin)
    );

    commonFriendsBaseOrigin.forEach((baseOrigin, i) => {
      const node = this.commonFriendNodes[i];

      Rx.Observable
        .of(baseOrigin)
        .combineLatest(spring$)
        .map(([targetOrigin, springValue]) =>
          this.applySpringToFriendOrigin(targetOrigin, springValue, i)
        )
        .combineLatest(friendOrigin$)
        .withLatestFrom(spring$)
        .subscribe(([[commonFriendOrigin, friendOrigin], springValue]) => {
          this.onUpdateCommonFriend(node, commonFriendOrigin, springValue);
          // this.onUpdateTopLine(
          //   this.topLineNodes[i],
          //   commonFriendOrigin,
          //   friendOrigin,
          //   springValue
          // );
        });
    });

    spring.start();
  }

  onRootNode = node => {
    this.rootNode = node;
  };

  onFriendRef = node => {
    this.friendNode = node;
  };

  onTopLinesRef = node => {
    this.topLineNodes = node.children;
  };

  onCommonFriendsRef = node => {
    this.commonFriendNodes = node.children;
  };

  onUpdateTopLine = (node, commonFriendOrigin, friendOrigin, springValue) => {
    // const {offsetHeight, portraitSize} = this.props;
    // const isOutOfViewport =
    //   friendOrigin.y - commonFriendOrigin.y > offsetHeight - portraitSize / 2 ||
    //   commonFriendOrigin.y - friendOrigin.y > userPosition.bottom + portraitSize;
    //
    // if (isOutOfViewport) {
    //   node.style.opacity = 0;
    //   return;
    // }
    // const dx = Math.abs(commonFriendOrigin.x - friendOrigin.x);
    // const dy = Math.abs(commonFriendOrigin.y - friendOrigin.y);
    // const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    //
    // let degrees = MathUtils.radiantToDegress(Math.atan(dy / dx));
    // if (commonFriendOrigin.y < friendOrigin.y) degrees *= -1;
    // if (commonFriendOrigin.x < friendOrigin.x) degrees = 180 - degrees;
    //
    // node.style.transform = `rotate(${degrees}deg) scaleX(${d})`;
    // node.style.opacity = springValue;
  };

  onUpdateCommonFriend = (node, origin, springValue) => {
    const {portraitSize} = this.props;
    const x = origin.x - portraitSize / 2;
    const y = origin.y - portraitSize / 2;
    node.style.transform = `translate(${x}px, ${y}px) scale(0.85)`;
    node.style.opacity = springValue;
  };

  onUpdateFriend = (node, origin) => {
    const {portraitSize} = this.props;
    const x = origin.x - portraitSize / 2;
    const y = origin.y - portraitSize / 2;
    node.style.transform = `translate(${x}px, ${y}px)`;
  };

  applySpringToFriendOrigin = (targetOrigin, springValue, i) => {
    // Only animate the common friends that will be visible initially
    if (i > 2) return targetOrigin;

    const {offsetWidth, offsetHeight} = this.props;
    const initialOrigin = {
      x: offsetWidth / 2,
      y: offsetHeight / 2
    };

    return this.interpolateOrigins(initialOrigin, targetOrigin, springValue);
  };

  mapSpringToFriendOrigin = (springValue, scrollTop) => {
    const {
      friend: {origin: initialOrigin},
      offsetWidth,
      portraitSize
    } = this.props;
    const targetOrigin = {
      x: offsetWidth / 2,
      y: scrollTop + portraitSize / 2 + 40
    };

    return this.interpolateOrigins(initialOrigin, targetOrigin, springValue);
  };

  interpolateOrigins(initial, target, springValue) {
    return {
      x: MathUtils.interpolateRange({
        outputStart: initial.x,
        outputEnd: target.x,
        current: springValue,
        clamp: false
      }),
      y: MathUtils.interpolateRange({
        outputStart: initial.y,
        outputEnd: target.y,
        current: springValue,
        clamp: false
      })
    };
  }

  render() {
    const {friend, portraitSize, commonFriends, offsetHeight} = this.props;

    return (
      <div
        className={cx(cs.root, {[cs.root_active]: friend})}
        ref={this.onRootNode}
      >
        {friend && (
          <Person
            {...friend}
            className={cs.friend}
            onNodeRef={this.onFriendRef}
            size={portraitSize}
          />
        )}

        <div
          className={cs.commonFriends}
          ref={this.onCommonFriendsRef}
          style={{height: offsetHeight}}
        >
          {commonFriends.map(commonFriend => (
            <Person
              key={commonFriend.id}
              {...commonFriend}
              className={cs.commonFriend}
              size={portraitSize}
            />
          ))}
        </div>

        <div ref={this.onTopLinesRef}>
          {commonFriends.map(commonFriend => (
            <div className={cs.line} key={commonFriend.id} />
          ))}
        </div>
      </div>
    );
  }
}
