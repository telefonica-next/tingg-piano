import config from '../../config';

let ws = null;

const initialState = {
  connected: false,
  connecting: false,
  error: null,
  messages: [],
};

// Action constants
const CONNECT = 'dataWS / CONNECT';
const CONNECTED = 'dataWS / CONNECTED';
export const MESSAGE_UPDATE = 'dataWS / UPDATE';
const SEND = 'dataWS / SEND';
const ERROR = 'dataWS / ERROR';
const CLOSE = 'dataWS / CLOSE';

// Reducer
export default (state = initialState, action = {}) => {
  switch (action.type) {
    case CONNECT:
      return { ...state, connecting: true, error: null };
    case CONNECTED:
      return { ...state, connecting: false, connected: true, error: null };
    case ERROR:
      return { ...state, connecting: false, connected: false, error: null };
    case CLOSE:
      return { ...state, connecting: false, connected: false, error: null };

    case MESSAGE_UPDATE:
      return { ...state, messages: [...state.messages, action.message] };

    default:
      return state;
  }
};

// Actions
export const connect = (onMessage = () => {}) => (dispatch, getState) => new Promise((resolve, reject) => {
  if (ws) {
    ws.close();
  }

  ws = new WebSocket(`${config.tinggWS}/thing-data?token=${config.authToken}`);

  ws.addEventListener('open', () => {
    dispatch({ type: CONNECTED });
    resolve();
  });

  ws.addEventListener('message', e => {
    try {
      const message = JSON.parse(e.data);
      dispatch({ type: `dataWS / ${message.type.toUpperCase()}`, message });
      onMessage(message);
    } catch (error) {
      dispatch({ type: ERROR, error });
    }
  });

  ws.addEventListener('error', error => {
    dispatch({ type: ERROR, error });
    reject(error);
  });

  dispatch({ type: CONNECT });
});

export const send = message => {
  if (!ws) {
    throw new Error('Socket not open');
  }

  ws.send(JSON.stringify(message));
  return { type: SEND, message };
};

export const addOnMessage = onMessage => {
  ws.addEventListener('message', onMessage);
  return { type: 'dataWS / addOnMessage' };
};

export const removeOnMessage = onMessage => {
  ws.removeEventListener('message', onMessage);
  return { type: 'dataWS / removeOnMessage' };
};

export const close = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  return { type: CLOSE };
};
