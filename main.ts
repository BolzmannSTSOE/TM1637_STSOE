/**
* makecode Four Digit Display (TM1637) Package.
* From microbit/micropython Chinese community.
* http://www.micropython.org.cn
*/

/**
 * Four Digit Display
 */
//% weight=100 color=#50A820 icon="8"
namespace TM1637 {
    let TM1637_CMD1 = 0x40;
    let TM1637_CMD2 = 0xC0;
    let TM1637_CMD3 = 0x80;
    let TM1637_PAUSE_TIME_US = 10;
    let _SEGMENTS = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];

    /**
     * TM1637 LED display
     */
    export class TM1637LEDs {
        buf: Buffer;
        clk: DigitalPin;
        dio: DigitalPin;
        _ON: number;
        brightness: number;
        count: number;  // number of LEDs

        constructor(clk: DigitalPin, dio: DigitalPin, intensity: number, count: number) {
            this.clk = clk;
            this.dio = dio;
            this.count = count;
            this.brightness = intensity;
        }

        /**
         * initial TM1637
         */
        init(): void {
            pins.digitalWritePin(this.clk, 0);
            control.waitMicros(TM1637_PAUSE_TIME_US);
            pins.digitalWritePin(this.dio, 0);
            this._ON = 8;
            this.buf = pins.createBuffer(this.count);
            this.clear();
        }

        /**
         * Start 
         */
        _start() {
            pins.digitalWritePin(this.dio, 0);
            pins.digitalWritePin(this.clk, 0);
            control.waitMicros(TM1637_PAUSE_TIME_US);
        }

        /**
         * Stop
         */
        _stop() {
            pins.digitalWritePin(this.dio, 0);
            pins.digitalWritePin(this.clk, 1);
            control.waitMicros(TM1637_PAUSE_TIME_US);
            pins.digitalWritePin(this.dio, 1);
        }

        /**
         * send command1
         */
        _write_data_cmd() {
            this._start();
            this._write_byte(TM1637_CMD1);
            this._stop();
        }

        /**
         * send command3
         */
        _write_dsp_ctrl() {
            this._start();
            this._write_byte(TM1637_CMD3 | this._ON | this.brightness);
            this._stop();
        }

        /**
         * send a byte to 2-wire interface
         */
        _write_byte(b: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.dio, (b >> i) & 1);
                pins.digitalWritePin(this.clk, 1);
                control.waitMicros(TM1637_PAUSE_TIME_US);
                pins.digitalWritePin(this.clk, 0);
                control.waitMicros(TM1637_PAUSE_TIME_US);
            }
            pins.digitalWritePin(this.clk, 1);
            control.waitMicros(TM1637_PAUSE_TIME_US);
            pins.digitalWritePin(this.clk, 0);
            control.waitMicros(TM1637_PAUSE_TIME_US);
        }

        /**
         * set TM1637 intensity, range is [0-8], 0 is off.
         * @param val PARA_INTENSITY_VAL
         */
        //% blockId="TM1637_set_intensity" block="FUNC_INTENSITY"
        //% weight=50 blockGap=8
        //% parts="TM1637"
        intensity(val: number = 7) {
            if (val < 1) {
                this.off();
                return;
            }
            if (val > 8) val = 8;
            this._ON = 8;
            this.brightness = val - 1;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }

        /**
         * set data to TM1637, with given bit
         */
        _dat(bit: number, dat: number) {
            this._write_data_cmd();
            this._start();
            this._write_byte(TM1637_CMD2 | (bit % this.count))
            this._write_byte(dat);
            this._stop();
            this._write_dsp_ctrl();
        }
        
        /**
         * Build a segment mask from switches.
         *
         *   a
         * f   b
         *   g
         * e   c
         *   d      
         * @param a PARA_SEGMENTSAT_SEGMENTSAT_a
         * @param b PARA_SEGMENTSAT_SEGMENTSAT_b
         * @param c PARA_SEGMENTSAT_SEGMENTSAT_c
         * @param d PARA_SEGMENTSAT_SEGMENTSAT_d
         * @param e PARA_SEGMENTSAT_SEGMENTSAT_e
         * @param f PARA_SEGMENTSAT_SEGMENTSAT_f
         * @param g PARA_SEGMENTSAT_SEGMENTSAT_g
         * @param pos PARA_SEGMENTSAT_POS
         */
        //% blockId="TM1637_segmentsAt"
        //% block="FUNC_SEGMENTSAT"
        //% inlineInputMode=inline
        //% weight=89 blockGap=8 advanced=true
        //% parts="TM1637" pos.min=0 pos.max=3 pos.dflt=0
        segmentsAt(a: boolean, b: boolean, c: boolean, d: boolean, e: boolean, f: boolean, g: boolean, pos: number = 1) {
            let mask = 0
            if (a) mask |= 1 << 0
            if (b) mask |= 1 << 1
            if (c) mask |= 1 << 2
            if (d) mask |= 1 << 3
            if (e) mask |= 1 << 4
            if (f) mask |= 1 << 5
            if (g) mask |= 1 << 6
            //if (dp) mask |= 1 << 7
            this.lightSegmentsAt(mask, pos)
        }
        /**
         * Light indicated segments (bitmask) at given position.
         *
         * Segment bits (MSB -> LSB):
         * bit6=g, bit5=f, bit4=e, bit3=d, bit2=c, bit1=b, bit0=a
         *
         *   a
         * f   b
         *   g
         * e   c
         *   d      
         *
         * Example:
         * - "8" (all segments a..g): 0b01111111
         * - "4" (b,c,f,g):           0b01100110
         *
         * @param segments PARA_LIGHTSEGMENTSAT_SEGMENTS
         * @param pos PARA_LIGHTSEGMENTSAT_POS
         */
        //% blockId="TM1637_lightsegmentsat" block="FUNC_LIGHTSEGMENTSAT"
        //% weight=90 blockGap=8 advanced=true
        //% parts="TM1637" segments.dflt=0b01111111 pos.min=0 pos.max=3 pos.dflt=0
        lightSegmentsAt(segments: number = 0b01111111, pos: number = 0) {
            this.buf[pos % this.count] = segments & 0xFF
            this._dat(pos, segments & 0xFF)
        }

        /**
         * light indicated segments at given position.
         * @param segments segments to light, eg: 0x7F
         * @param pos the position of the digit, eg: 0
         */
/*        //% blockId="TM1637_lightsegmentsat" block="$this(tm)|light segments %segments |at %pos"
        //% weight=90 blockGap=8 advanced=true
        //% parts="TM1637" segments.dflt=0x7F pos.min=1 pos.max=6 pos.dflt=4
        lightSegmentsAt(segments: number = 0x7F, pos: number = 1) {
            pos-- //position in TM1637 indexed from 0
            this.buf[pos % this.count] = segments % 256
            this._dat(pos, segments % 256)
        }
*/
        
        /**
         * show a number in given position. 
         * @param num PARA_SHOWBIT_NUM
         * @param bit PARA_SHOWBIT_BIT
         */
        //% blockId="TM1637_showbit" block="FUNC_SHOWBIT"
        //% weight=90 blockGap=8
        //% parts="TM1637" num.min=-999 num.max=9999 bit.min=0 bit.max=3
        showbit(num: number = 5, bit: number = 0) {
            this.buf[bit % this.count] = _SEGMENTS[num % 16]
            this._dat(bit, _SEGMENTS[num % 16])
        }

        /**
          * show a number. 
          * @param num PARA_SHOWNUMBERWITHLEADINGZEROS_NUM
          */
        //% blockId="TM1637_shownumwithleadingzeros" block="FUNC_SHOWNUMBERWITHLEADINGZEROS"
        //% weight=91 blockGap=8
        //% parts="TM1637" num.min=-999 num.max=9999 num.dflt=0
        showNumberWithLeadingZeros(num: number) {
            if (num < 0) {
                this._dat(0, 0x40) // '-'
                num = -num
            }
            else
                this.showbit(Math.idiv(num, 1000) % 10)
            this.showbit(num % 10, 3)
            this.showbit(Math.idiv(num, 10) % 10, 2)
            this.showbit(Math.idiv(num, 100) % 10, 1)
        }

        /**
          * show a number with max 4 digits. 
          * @param num PARA_SHOWNUMBER_NUM
          */
        //% blockId="TM1637_shownum" block=FUNC_SHOWNUMBER
        //% weight=92 blockGap=8
        //% parts="TM1637" num.min=-999 num.max=9999 num.dflt=0
        showNumber(num: number) {
            if (num < 0) {
                this._dat(0, 0x40) // '-'
                num = -num
            }
            else
                if (num > 999) 
                    this.showbit(Math.idiv(num, 1000) % 10, 0); else this.showbit(-1, 0);
            if (num > 99) this.showbit(Math.idiv(num, 100) % 10, 1); else this.showbit(-1, 1);
            if (num >  9) this.showbit(Math.idiv(num, 10) % 10, 2); else this.showbit(-1, 2);
            if (num >= 0) this.showbit(num % 10, 3); else this.showbit(-1, 3);
            /*
            else
                if (num > 999) 
                    this.showbit(Math.idiv(num, 1000) % 10, 0); else this.showbit(-1, 0);
            if (num > 99) this.showbit(Math.idiv(num, 100) % 10, 1); else this.showbit(-1, 1);
            if (num >  9) this.showbit(Math.idiv(num, 10) % 10, 2); else this.showbit(-1, 2);
            if (num >= 0) this.showbit(num % 10, 3); else this.showbit(-1, 3);
            */
        }

        /**
          * show a hex number. 
          * @param num PARA_SHOWHEX_NUM
          */
        //% blockId="TM1637_showhex" block="FUNC_SHOWHEX"
        //% weight=90 blockGap=8
        //% parts="TM1637"
        showHex(num: number) {
            if (num < 0) {
                this._dat(0, 0x40) // '-'
                num = -num
            }
            else
                this.showbit((num >> 12) % 16)
            this.showbit(num % 16, 3)
            this.showbit((num >> 4) % 16, 2)
            this.showbit((num >> 8) % 16, 1)
        }

        /**
         * show or hide dot point. 
         * @param bit PARA_SHOWDP_BIT
         * @param show PARA_SHOWDP_SHOW
         */
        //% blockId="TM1637_showDP" block="FUNC_SHOWDP"
        //% weight=70 blockGap=8
        //% parts="TM1637"
        showDP(bit: number = 1, show: boolean = true) {
            bit = bit % this.count
            if (show) this._dat(bit, this.buf[bit] | 0x80)
            else this._dat(bit, this.buf[bit] & 0x7F)
        }

        /**
         * clear LED. 
         */
        //% blockId="TM1637_clear" block="FUNC_CLEAR"
        //% weight=80 blockGap=8
        //% parts="TM1637"
        clear() {
            for (let i = 0; i < this.count; i++) {
                this._dat(i, 0)
                this.buf[i] = 0
            }
        }

        /**
         * turn on LED. 
         */
        //% blockId="TM1637_on" block="FUNC_ON"
        //% weight=86 blockGap=8
        //% parts="TM1637"
        on() {
            this._ON = 8;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }

        /**
         * turn off LED. 
         */
        //% blockId="TM1637_off" block="FUNC_OFF"
        //% weight=85 blockGap=8
        //% parts="TM1637"
        off() {
            this._ON = 0;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }
    }

    /**
     * create a Digit Display (TM1637) object.
     * @param clk the CLK pin for TM1637, eg: DigitalPin.P0
     * @param dio the DIO pin for TM1637, eg: DigitalPin.P1
     * @param intensity the brightness of the LED, eg: 7
     * @param count the count of the LED, eg: 4
     */
    //% weight=200 blockGap=8
    //% blockId="TM1637_create" block="CLK %clk|DIO %dio|brightness %intensity|digit count %count"
    //% inlineInputMode=inline count.min=1 count.max=4 count.dflt=4 intensity.min=0 intensity.max=8 intensity.dflt=7
    //% blockSetVariable=tm
    export function create(clk: DigitalPin, dio: DigitalPin, intensity: number, count: number = 4): TM1637LEDs {
        let tm = new TM1637LEDs(clk, dio, intensity, count);
        tm.init();
        return tm;
    }
}
