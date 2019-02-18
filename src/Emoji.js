import React, { Component } from 'react'

export default class Emoji extends Component {
  render(props) {
    return (
      <span className="emoji" role="img" aria-label={props.label ? props.label : ""}>
        {props.symbol}
      </span>
    );
  }
}
