(function(){
    'use strict';

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    var app = {
        frequency: 66,
        defaultVolume: 1,
        chunkIndex: 0,
        chunkLength: 0,

        init: function() {
            this.context = new window.AudioContext();
            this.setupView();
            this.requestChunk(this.chunkIndex);
        },

        setupView: function() {
            this.textDisplay = document.createElement('div');
            document.body.appendChild(this.textDisplay);
        },

        requestChunk: function(index) {
            index = index || 0;

            var request;

            request = new XMLHttpRequest();
            request.open('GET', '../data/chunk-' + index + '.txt');
            request.onload = this.onLoadSuccess.bind(this, request, index);

            request.send();
        },

        onLoadSuccess: function(request, index) {
            if (request.status !== 200) {
                this.onFetchError();
                return;
            }

            this.addTextChunk(request.responseText);

            if (index !== 0) {
                return;
            }

            this.chunkLength = request.responseText.length;
            this.startReading();
        },

        addTextChunk: function(text) {
            this.textDisplay.innerHTML += text;
        },

        onFetchError: function(error) {
            throw Error(error);
        },

        setupReading: function(text) {
            window.setTimeout(function() {
                this.startReading();
            }.bind(this), 1000);
        },

        startReading: function() {
            var content, notes;

            content = this.textDisplay.innerHTML;

            if (content === '') {
                return;
            }

            if (content.length < this.chunkLength) {
                this.chunkIndex += 1;
                this.requestChunk(this.chunkIndex);
            }

            notes = this.noteFromContent(content);

            this.textDisplay.innerHTML = content.substr(notes.length);

            this.sing(notes);

            var timeout = notes.charCodeAt(0) < 57 && notes.charCodeAt(0) > 48 ?
                                                    7 : notes.length;

            window.setTimeout(function() {
                this.startReading();
            }.bind(this), 200 * timeout);
        },

        noteFromContent: function(content) {
            var wordBoundary, fragment;

            fragment = content.substr(0, 5);

            if (isNaN(parseInt(fragment.charAt(0), 10))) {
                return fragment.substr(0, 1);
            }

            wordBoundary = fragment.search(/\d+:\d+/);

            if (wordBoundary === -1) {
                return fragment.substr(0, 1);
            }

            return fragment.substr(0, fragment.match(/\d+:\d+/)[0].length);

        },

        sing: function(notes) {
            notes.split('').forEach(function(note, index) {
                var charValue, highlight, frequency, multiplier;

                charValue = note.charCodeAt(0);

                if (charValue === 32) {
                    return;
                }

                note = this.lowNote(charValue, index, notes.length);

                this.play(note[0], note[1]);
            }, this);
        },


        lowNote: function(note, index, notesLength) {
            var highlight, frequency, multiplier;
            frequency = note * 1.35;
            highlight = note < 57 && note > 48;
            frequency = highlight === true ? frequency * 7 : frequency;
            multiplier = highlight === true ? 10 : notesLength;

            return [frequency, multiplier];
        },

        play: function(frequency, length) {
            var osc, envelope, attack, release;

            osc = this.context.createOscillator();
            envelope = this.context.createGain();
            attack = 5;
            release = 250 * length;

            envelope.gain.setValueAtTime(this.defaultVolume,
                                         this.context.currentTime);
            envelope.connect(this.context.destination);
            envelope.gain.setValueAtTime(0, this.context.currentTime);
            envelope.gain.setTargetAtTime(this.defaultVolume,
                                          this.context.currentTime,
                                          attack / 1000);
            if (release) {
                envelope.gain.setTargetAtTime(0,
                                 this.context.currentTime + attack / 1000,
                                 release / 1000);

                setTimeout(function() {
                    osc.stop();
                    osc.disconnect(envelope);
                    envelope.gain.cancelScheduledValues(this.context.currentTime);
                    envelope.disconnect(this.context.destination);
                }.bind(this), attack * 10 + release * 10);
            }

            osc.frequency.setValueAtTime(frequency, this.context.currentTime);
            osc.type = 'sine';
            osc.connect(envelope);
            osc.start();

        }
    };

    app.init();

}());
