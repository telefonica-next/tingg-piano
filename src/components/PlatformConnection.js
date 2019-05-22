import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import config from '../config';
import {
  connect as connectDataWS,
  close as closeDataWS,
  send as sendDataWS,
} from '../store/ducks/dataWS';


class GameMaster extends Component {
  componentDidMount() {
    const { connectDataWS } = this.props;

    connectDataWS()
      .then(() => {
        const { sendDataWS } = this.props;
        sendDataWS({
          type: 'subscribe',
          data: {
            thingId: config.pianoThingId,
            topics: ['note'],
          },
        });
        sendDataWS({
          type: 'subscribe',
          data: {
            thingId: config.otherThingId,
            topics: ['note'],
          },
        });
      });
  }

  componentWillUnmount() {
    this.props.closeDataWS();
  }

  render() {
    return null;
  }
}

const mapStateToProps = (state, ownProps) => ({
  wsConnected: state.dataWS.connected,
  wsConnecting: state.dataWS.connecting,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  connectDataWS,
  sendDataWS,
  closeDataWS,
}, dispatch);

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(GameMaster);
