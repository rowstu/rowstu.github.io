/**
 * MicroMod - A minimal JavaScript MOD/XM player
 * Based on the MOD format specification
 * Simplified for basic 4-channel MOD playback
 */

class MicroMod {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.playing = false;
    this.module = null;
    this.scriptNode = null;
    this.sampleRate = audioContext.sampleRate;

    // Playback state
    this.tick = 0;
    this.row = 0;
    this.pattern = 0;
    this.speed = 6;
    this.tempo = 125;
    this.samplesPerTick = 0;
    this.tickSamplePos = 0;

    // Channels
    this.channels = [];

    // Period table for notes (Amiga periods)
    this.periodTable = [
      // C-1 to B-1
      856,808,762,720,678,640,604,570,538,508,480,453,
      // C-2 to B-2
      428,404,381,360,339,320,302,285,269,254,240,226,
      // C-3 to B-3
      214,202,190,180,170,160,151,143,135,127,120,113
    ];
  }

  async load(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.parse(new Uint8Array(buffer));
    return this;
  }

  parse(data) {
    // Check for signature at offset 1080 to determine format
    const sig = String.fromCharCode(data[1080], data[1081], data[1082], data[1083]);

    let numChannels = 4;
    let numSamples = 15;

    // Check for 31-sample MOD signatures
    if (sig === 'M.K.' || sig === 'M!K!' || sig === '4CHN' || sig === 'FLT4') {
      numChannels = 4;
      numSamples = 31;
    } else if (sig === '6CHN') {
      numChannels = 6;
      numSamples = 31;
    } else if (sig === '8CHN' || sig === 'OCTA' || sig === 'CD81') {
      numChannels = 8;
      numSamples = 31;
    } else if (sig.match(/^\d\dCH$/)) {
      numChannels = parseInt(sig.substring(0, 2));
      numSamples = 31;
    }

    this.module = {
      title: this.readString(data, 0, 20),
      numChannels: numChannels,
      samples: [],
      patterns: [],
      positions: [],
      numPositions: 0
    };

    // Read sample headers
    let offset = 20;
    for (let i = 0; i < numSamples; i++) {
      const sample = {
        name: this.readString(data, offset, 22),
        length: ((data[offset + 22] << 8) | data[offset + 23]) * 2,
        finetune: data[offset + 24] & 0x0F,
        volume: data[offset + 25],
        loopStart: ((data[offset + 26] << 8) | data[offset + 27]) * 2,
        loopLength: ((data[offset + 28] << 8) | data[offset + 29]) * 2,
        data: null
      };

      if (sample.finetune > 7) sample.finetune -= 16;
      this.module.samples.push(sample);
      offset += 30;
    }

    // Song length and positions
    this.module.numPositions = data[offset];
    offset += 2; // Skip restart position

    // Read pattern order
    let maxPattern = 0;
    for (let i = 0; i < 128; i++) {
      this.module.positions[i] = data[offset + i];
      if (data[offset + i] > maxPattern) maxPattern = data[offset + i];
    }
    offset += 128;

    // Skip signature for 31-sample mods
    if (numSamples === 31) offset += 4;

    // Read patterns
    const numPatterns = maxPattern + 1;
    for (let p = 0; p < numPatterns; p++) {
      const pattern = [];
      for (let row = 0; row < 64; row++) {
        const rowData = [];
        for (let ch = 0; ch < numChannels; ch++) {
          const b0 = data[offset++];
          const b1 = data[offset++];
          const b2 = data[offset++];
          const b3 = data[offset++];

          rowData.push({
            sample: (b0 & 0xF0) | ((b2 & 0xF0) >> 4),
            period: ((b0 & 0x0F) << 8) | b1,
            effect: b2 & 0x0F,
            param: b3
          });
        }
        pattern.push(rowData);
      }
      this.module.patterns.push(pattern);
    }

    // Read sample data
    for (let i = 0; i < numSamples; i++) {
      const sample = this.module.samples[i];
      if (sample.length > 0) {
        sample.data = new Float32Array(sample.length);
        for (let j = 0; j < sample.length; j++) {
          // Convert signed 8-bit to float
          let val = data[offset++];
          if (val > 127) val -= 256;
          sample.data[j] = val / 128;
        }
      }
    }

    // Initialize channels
    this.channels = [];
    for (let i = 0; i < numChannels; i++) {
      this.channels.push({
        sample: 0,
        period: 0,
        volume: 64,
        pos: 0,
        speed: 0
      });
    }

    this.updateTempo();
    console.log('MOD loaded:', this.module.title, '- Channels:', numChannels, 'Patterns:', numPatterns);
  }

  readString(data, offset, length) {
    let str = '';
    for (let i = 0; i < length; i++) {
      const c = data[offset + i];
      if (c === 0) break;
      str += String.fromCharCode(c);
    }
    return str.trim();
  }

  updateTempo() {
    // Samples per tick = sampleRate * 2.5 / tempo
    this.samplesPerTick = Math.floor((this.sampleRate * 2.5) / this.tempo);
  }

  play() {
    if (this.playing || !this.module) return;

    this.playing = true;
    this.tick = 0;
    this.row = 0;
    this.pattern = 0;
    this.tickSamplePos = 0;

    // Reset channels
    for (const ch of this.channels) {
      ch.pos = 0;
      ch.speed = 0;
    }

    // Create script processor
    this.scriptNode = this.ctx.createScriptProcessor(4096, 0, 2);
    this.scriptNode.onaudioprocess = (e) => this.process(e);
    this.scriptNode.connect(this.ctx.destination);
  }

  stop() {
    this.playing = false;
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
  }

  process(e) {
    const left = e.outputBuffer.getChannelData(0);
    const right = e.outputBuffer.getChannelData(1);
    const len = left.length;

    for (let i = 0; i < len; i++) {
      // Process tick
      if (this.tickSamplePos >= this.samplesPerTick) {
        this.tickSamplePos = 0;
        this.processTick();
      }
      this.tickSamplePos++;

      // Mix channels
      let l = 0, r = 0;
      for (let c = 0; c < this.channels.length; c++) {
        const ch = this.channels[c];
        if (ch.speed > 0 && ch.sample > 0) {
          const sample = this.module.samples[ch.sample - 1];
          if (sample && sample.data) {
            const pos = Math.floor(ch.pos);
            if (pos < sample.data.length) {
              const val = sample.data[pos] * (ch.volume / 64);
              // Pan: channels 0,3 left, 1,2 right (Amiga style)
              if (c === 0 || c === 3) {
                l += val * 0.8;
                r += val * 0.2;
              } else {
                l += val * 0.2;
                r += val * 0.8;
              }
              ch.pos += ch.speed;

              // Handle looping
              if (sample.loopLength > 2) {
                if (ch.pos >= sample.loopStart + sample.loopLength) {
                  ch.pos = sample.loopStart;
                }
              }
            }
          }
        }
      }

      left[i] = Math.max(-1, Math.min(1, l));
      right[i] = Math.max(-1, Math.min(1, r));
    }
  }

  processTick() {
    this.tick++;
    if (this.tick >= this.speed) {
      this.tick = 0;
      this.processRow();
    }
  }

  processRow() {
    if (!this.module || this.pattern >= this.module.numPositions) {
      // Loop back to start
      this.pattern = 0;
      this.row = 0;
    }

    const patternNum = this.module.positions[this.pattern];
    const pattern = this.module.patterns[patternNum];

    if (!pattern) {
      this.pattern++;
      this.row = 0;
      return;
    }

    const rowData = pattern[this.row];

    for (let c = 0; c < this.channels.length; c++) {
      const note = rowData[c];
      const ch = this.channels[c];

      if (note.sample > 0) {
        ch.sample = note.sample;
        const sample = this.module.samples[note.sample - 1];
        if (sample) {
          ch.volume = sample.volume;
        }
      }

      if (note.period > 0) {
        ch.period = note.period;
        ch.pos = 0;
        // Calculate playback speed from period
        // Amiga clock / (period * 2) gives frequency
        // speed = frequency / sampleRate
        ch.speed = (3546895 / (ch.period * 2)) / this.sampleRate;
      }

      // Basic effects
      switch (note.effect) {
        case 0x0C: // Set volume
          ch.volume = Math.min(64, note.param);
          break;
        case 0x0F: // Set speed/tempo
          if (note.param < 32) {
            this.speed = note.param || 1;
          } else {
            this.tempo = note.param;
            this.updateTempo();
          }
          break;
        case 0x0B: // Pattern jump
          this.pattern = note.param;
          this.row = -1;
          break;
        case 0x0D: // Pattern break
          this.pattern++;
          this.row = -1;
          break;
      }
    }

    this.row++;
    if (this.row >= 64) {
      this.row = 0;
      this.pattern++;
    }
  }
}

// Export for use
window.MicroMod = MicroMod;
