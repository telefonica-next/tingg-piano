import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import config from '../../config';
import {
  addOnMessage,
  removeOnMessage,
} from '../../store/ducks/dataWS';
import './start.scss';


class StartPage extends Component {
  componentDidMount() {
    if (this.props.wsConnected) {
      this.props.addOnMessage(this.onMessage);
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.wsConnected && this.props.wsConnected) {
      this.props.addOnMessage(this.onMessage);
    }
  }

  componentWillUnmount() {
    this.props.removeOnMessage(this.onMessage);
  }

  onMessage = e => {
    this.props.history.push('/π');
  };

  render() {
    return (
      <div className="start-page">
        <h1 className="title">Touch any Star to start…</h1>
        <img
          src={`${config.publicUrl}/assets/star-splash.svg`}
          className="icon-star"
          alt="Star"
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  wsConnected: state.dataWS.connected,
  wsConnecting: state.dataWS.connecting,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  addOnMessage,
  removeOnMessage,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(StartPage);
