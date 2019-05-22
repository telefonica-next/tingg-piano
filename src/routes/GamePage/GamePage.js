import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactAudioPlayer from 'react-audio-player';
import cx from 'classnames';
import Tone from 'tone';
import config from '../../config';
import {
  addOnMessage,
  removeOnMessage,
} from '../../store/ducks/dataWS';
import './game.scss';

const NOTES =
  [2, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 2, 3, 3, 2, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 3, 4, 4];
const NOTES_DELAY =
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6.5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 4.5];
const NOTE_MAPPER = {
  0: 'G5',
  1: 'F5',
  2: 'E5',
  3: 'D5',
  4: 'C5',
};
const INITIAL_STATE = {
  currentNoteIdx: 0,
  soundName: null,

  numErrors: 0,
  startTime: null,
  endTime: null,

  noteText: null, // Coool or Oooops
  showResults: false,
  error: false,
  errorNote: null,
  funnyNote: null,
};

class GamePage extends Component {
  state = INITIAL_STATE;

  componentDidMount() {
    const { wsConnected, location } = this.props;
    this.synth = new Tone.Synth().toMaster();
    if (wsConnected) {
      this.props.addOnMessage(this.onMessage);
    }

    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 100);

    if (location.query.hasOwnProperty('auto')) {
      this.autoPlay();
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

  autoPlay = () => {
    const { currentNoteIdx } = this.state;
    setTimeout(() => {
      this.processNote(NOTES[currentNoteIdx]);
      if (currentNoteIdx < NOTES.length - 1) {
        this.autoPlay();
      }
    }, NOTES_DELAY[currentNoteIdx] * 100);
  };

  /** key = started || finished */
  updateStats = key => {
    try {
      const stats = JSON.parse(localStorage.getItem('tng.piano.stats')) || {};
      localStorage.setItem('tng.piano.stats', JSON.stringify({
        ...stats,
        [key]: (stats[key] || 0) + 1,
      }));
    } catch (e) {
    }
  };

  onMessage = e => {
    try {
      const { data: { thingId, payload } } = JSON.parse(e.data);
      if (thingId === config.pianoThingId) {
        this.processNote(parseInt(payload.value - 1));
      } else if (thingId === config.otherThingId) {
        this.playFailSound(parseInt(payload.value - 1));
      }
    } catch (error) {
      console.error('Game.onMessage', error);
    }
  };

  playFailSound = note => {
    if (!/^[0-6]$/.test(note)) {
      return;
    }
    const soundName = `fail-${String.fromCharCode(note + 65)}`;
    this.setState(
      { soundName: null },
      () => { this.setState({ soundName }); },
    );

    this.shakeNotes();
  };

  shakeNotes = () => {
    if (!this.funnyNoteTimeout) {
      this.setState({ funnyNote: true });
    }

    this.funnyNoteTimeout = setTimeout(() => {
      this.setState({ funnyNote: false });
      this.funnyNoteTimeout = null;
    }, 1000);
  };

  processNote = note => {
    const { currentNoteIdx, showResults } = this.state;

    if (currentNoteIdx === NOTES.length && showResults) {
      // Game ended, result is shown and it can be reset
      this.setState(INITIAL_STATE);

      // Removing message listener to ignore messages for "start up time"
      this.props.removeOnMessage(this.onMessage);
      setTimeout(() => {
        this.props.addOnMessage(this.onMessage);
      }, 1500);
    } else if (currentNoteIdx === NOTES.length && !showResults) {
      // Do nothing if the game ended, but results screen didn't show up yet.
      return;
    }

    const currentNote = NOTES[currentNoteIdx];

    if (note === currentNote) {
      const nextNoteIdx = currentNoteIdx + 1;
      const newState = {
        currentNoteIdx: nextNoteIdx,
        noteText: 'Cooool',
        error: null,
        errorNote: null,
      };

      // Start timer
      if (currentNoteIdx === 0) {
        newState.startTime = Date.now();
        this.updateStats('started');
      }

      this.setState(newState);

      // Play a note
      if (/^[0-4]$/.test(note)) {
        this.synth.triggerAttackRelease(NOTE_MAPPER[note], '8n');
      }

      // Scroll note to the middle of the screen
      window.scrollTo({
        top: 0,
        left: Math.max((nextNoteIdx * 150) - (window.innerWidth / 2), 0),
        behavior: 'smooth',
      });

      // Game ending, last note played
      if (nextNoteIdx === NOTES.length) {
        this.updateStats('finished');
        this.setState({ endTime: Date.now() });
        setTimeout(() => {
          this.setState({ showResults: true });
        }, 1500);
      }

    } else if (note !== currentNote && currentNoteIdx !== NOTES.length) {
      const { numErrors } = this.state;

      this.setState({
        soundName: null,
        error: true,
        errorNote: note,
        numErrors: numErrors + 1,
        noteText: 'Oooops',
      },
        () => {
          this.setState({
            soundName: `fail-${String.fromCharCode(Math.floor(Math.random() * 7) + 65)}`,
          });
        });
    }
  };

  renderNotes() {
    const { currentNoteIdx, noteText, error, errorNote, funnyNote } = this.state;
    const leftPadding = 30;
    const nextNoteWidth = 150;
    const noteLineHeight = 70;

    return (
      <div className={cx("notes-wrapper", { 'funny-note-shake-animation': funnyNote })}>
        <div className="note-lines" style={{ width: NOTES.length * nextNoteWidth + leftPadding }}>
          <div className="note-line" />
          <div className="note-line" />
          <div className="note-line" />
          <div className="note-line" />
          <div className="note-line" />
        </div>

        {noteText && (
          <span
            className={cx('note-text', { error })}
            style={{
              left: Math.max((currentNoteIdx - (error ? 0 : 1)) * nextNoteWidth, 0) + 25,
              top: 0,
            }}
          >
            {noteText}
          </span>
        )}

        <div className="notes-icons">
          {Number.isInteger(errorNote) && (
            <img
              style={{
                left: currentNoteIdx * nextNoteWidth + leftPadding - 30,
                top: errorNote * noteLineHeight,
              }}
              className="icon-note star-cooloops error"
              key="-1"
              src={`${config.publicUrl}/assets/star-cooloops-error.svg`}
              alt="Star"
            />
          )}
          {NOTES.map((note, idx) => {
            let left = idx * nextNoteWidth + leftPadding;
            let top = note * noteLineHeight + 30;
            let iconName = 'star-empty';
            if (idx < currentNoteIdx) {
              iconName = 'star';
            }
            if (idx === currentNoteIdx - 1 && !error) {
              iconName = 'star-cooloops';
              top -= 30;
              left -= 30;
            }

            return (
              <img
                style={{ left, top }}
                className={cx('icon-note', iconName)}
                key={idx}
                src={`${config.publicUrl}/assets/${iconName}.svg`}
                alt="Star"
              />
            );
          })}
        </div>
      </div>
    )
  }

  renderPlayer() {
    const { soundName } = this.state;
    if (!soundName) {
      return null;
    }
    return (
      <ReactAudioPlayer
        src={`${process.env.PUBLIC_URL}/assets/sounds/${soundName}.wav`}
        autoPlay
      />
    );
  }

  renderHeader() {
    const { currentNoteIdx } = this.state;
    return (
      <div className="header">
        <img
          src={`${config.publicUrl}/assets/logo-eurostar.svg`}
          className="logo-eurostar"
          alt="EuroStar logo"
        />
        <div className="score">
          {currentNoteIdx}/{NOTES.length}
        </div>
      </div>
    );
  }

  /** numErrors:  0 = perfect,  2 = ok, 2+ = amateur */
  renderResults() {
    const { numErrors, startTime, endTime } = this.state;
    const duration = (endTime - startTime) / 1000;
    let resultImg = 'result-wannabe.svg';
    let resultText = 'Wannabe';
    if (numErrors < 2) {
      resultImg = 'result-eurostar.png';
      resultText = 'Euro Star';
    } else if (numErrors > 5) {
      resultImg = 'result-amateur.svg';
      resultText = 'Amateur';
    }

    return (
      <div className="result-wrapper">
        <img
          src={`${config.publicUrl}/assets/${resultImg}`}
          className="result-img"
          alt="Result"
        />
        <span className="result-text">{resultText}</span>
        <span className="start-again-text">Touch any Star to start again…</span>
        <div className="time">Play time: {duration} s</div>
      </div>
    );
  }

  render() {
    const { showResults } = this.state;
    return (
      <div className="game-page">
        {this.renderHeader()}
        {showResults && this.renderResults()}
        {!showResults && this.renderNotes()}
        {this.renderPlayer()}
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

export default connect(mapStateToProps, mapDispatchToProps)(GamePage);
