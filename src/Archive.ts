import { ReadStream } from 'fs';
import { assert } from 'console';
type Key = string | number;

interface OutputBufferBuffer {
    bytes: string;
    length: number;
}
export interface Archive {
    isSaving(): boolean;
    isLoading(): boolean;

    //#region Functions that will be removed by the preprocessor
    transformInt(obj: number, count?: boolean): Promise<void>;
    transformString(obj: string, count?: boolean): Promise<void>;
    transformFloat(obj: number): Promise<void>;
    transformLong(obj: string): Promise<void>;
    transformByte(obj: number, count?: boolean): Promise<void>;
    transformHex(obj: string, count: number, shouldCount?: boolean): Promise<void>;
    //#endregion

    //#region Actual functions that the functions above will be replaced with
    _Int(obj: any, key: string | number, count?: boolean): Promise<void>;
    _String(obj: any, key: string | number, count?: boolean): Promise<void>;
    _Float(obj: any, key: string | number): Promise<void>;
    _Long(obj: any, key: string | number): Promise<void>;
    _Byte(obj: any, key: Key, count?: boolean): Promise<void>;
    _Hex(obj: any, key: Key, count: number, shouldCount?: boolean): Promise<void>;
    //#endregion

    transformBufferStart(resetBytesRead: boolean): Promise<number>;
    transformBufferEnd(): void;
    transformAssertNullByte(count?: boolean): void;
    transformAssertNullInt(count?: boolean): void;

}

/**
 * Base class that implements all the functions that will be removed by the preprocessor
 */
abstract class BaseArchive implements Archive {

    public abstract isSaving(): boolean;
    public abstract isLoading(): boolean;
    public abstract _Int(obj: any, key: string | number, count?: boolean): Promise<void>;
    public abstract _String(obj: any, key: string | number, count?: boolean): Promise<void>;
    public abstract _Float(obj: any, key: string | number): Promise<void>;
    public abstract _Long(obj: any, key: string | number): Promise<void>;
    public abstract _Byte(obj: any, key: string | number, count?: boolean): Promise<void>;
    public abstract transformBufferStart(resetBytesRead: boolean): Promise<number>;
    public abstract transformBufferEnd(): void;
    public abstract transformAssertNullByte(count?: boolean): void;
    public abstract transformAssertNullInt(count?: boolean): void;
    public abstract _Hex(
        obj: any, key: string | number, count: number, shouldCount?: boolean): Promise<void>;

    public async transformInt(obj: number, count?: boolean): Promise<void> {
        throw new Error('transformInt should be removed by preprocessor.');
    }

    public async transformString(obj: string, count?: boolean): Promise<void> {
        throw new Error('transformString should be removed by preprocessor.');
    }
    public async transformFloat(obj: number): Promise<void> {
        throw new Error('transformFloat should be removed by preprocessor.');
    }
    public async transformLong(obj: string): Promise<void> {
        throw new Error('transformLong should be removed by preprocessor.');
    }
    public async transformByte(obj: number, count?: boolean): Promise<void> {
        throw new Error('transformByte should be removed by preprocessor.');
    }
    public async transformHex(obj: string, count: number, shouldCount?: boolean): Promise<void> {
        throw new Error('transformHex should be removed by preprocessor.');
    }
}

export class LoadingArchive extends BaseArchive {
    public bytesRead: number;
    private stream: ReadStream;
    private cursor: number;

    constructor(stream: ReadStream) {
        super();
        this.stream = stream;
        this.stream.on('data', this.onData.bind(this));
        this.cursor = 0;
        this.bytesRead = 0;
    }

    public isSaving(): boolean {
        return false;
    }

    public isLoading(): boolean {
        return true;
    }

    public async _Int(obj: any, key: string | number, count: boolean = true): Promise<void> {
        obj[key] = await this.readInt();
    }

    public async _String(obj: any, key: string | number, count: boolean = true): Promise<void> {
        obj[key] = await this.readLengthPrefixedString();
    }

    public async _Float(obj: any, key: string | number): Promise<void> {
        obj[key] = await this.readFloat();
    }

    public async _Long(obj: any, key: string | number): Promise<void> {
        obj[key] = await this.readLong();
    }

    public async _Byte(obj: any, key: Key, count: boolean = true): Promise<void> {
        obj[key] = await this.readByte();
    }

    public async transformBufferStart(resetBytesRead: boolean): Promise<number> {
        const length = await this.readInt();
        if (resetBytesRead) {
            // is currently only true for the Entity as we don't add
            // missing sections anywhere else
            this.resetBytesRead();
        }
        return length;
    }

    public transformBufferEnd(): void {
        // TODO write missing?
    }

    public transformAssertNullByte(count: boolean = true): void {
        this.assertNullByte();
    }

    public transformAssertNullInt(count: boolean = true): void {
        this.assertNullInt();
    }

    public async _Hex(obj: any, key: Key, count: number, shouldCount: boolean = true):
        Promise<void> {
        obj[key] = await this.readHex(count);
    }

    //#region should be private
    public onData(data: string) {
        // TODO is it better to read directly from the stream instead of manually concatenating buffers?

        if (this.buffered === undefined) {
            console.log('undef');
            console.log(this.callback);
            console.log(this);
            this.buffered = Buffer.from('');
        }
        process.stdout.write('.');// + this.buffered.length);
        if (this.buffered.length > 0) {
            this.buffered = Buffer.concat([this.buffered, Buffer.from(data, 'binary')]);
        } else {
            this.buffered = Buffer.from(data, 'binary');
        }

        //console.log('asdf', this.callback);
        if (this.callback) {
            // console.log(this.buffered.length, '<', this.needBytes);
            if (this.buffered.length >= this.needBytes) {
                // got enough data
                const result = this.buffered.slice(0, this.needBytes);
                this.buffered = this.buffered.slice(this.needBytes);
                const cb = this.callback;
                this.callback = undefined;
                console.log(result);
                cb(result);
            }
        }
        // console.log('data', data);
    }

    private callback?: ((buffer: Buffer) => void) = undefined;
    private callbackError?: Error = undefined;
    private needBytes: number = 0;
    private buffered: Buffer = Buffer.from('');

    /**
     * Reads n bytes from the stream
     * synchronously waits until the required amount of bytes is read
     */
    public read(bytes: number): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            /*console.log(this);
            console.trace('cb', this.callback);*/
            if (this.buffered.length < bytes) {
                if (this.callback !== undefined) {
                    console.trace('callback already set', this.callback, this.callbackError);
                    console.log(this.callbackError!.stack);
                    process.exit(1);
                }
                assert(this.callback === undefined);
                this.needBytes = bytes;
                this.callback = resolve.bind(this);
                this.callbackError = new Error(); // to get the stack trace back to here
                //console.log(this.callback);
            } else {
                const result = this.buffered.slice(0, bytes);
                this.buffered = this.buffered.slice(bytes);
                console.log(result);
                resolve(result);
            }
            /*            const result = this.stream.read(bytes);
                        if (result === null) {
                            reject();
                        }
                        resolve(result);*/
        });

    }

    public async readInt(): Promise<number> {
        const result = (await this.read(4)).readInt32LE(0);
        this.cursor += 4;
        this.bytesRead += 4;
        return result;
    }
    public readLong(): Promise<string> {
        /*let result = this.buffer.readInt32LE(this.cursor);
              // TODO figure out how to actually deal with longs in JS!
              this.cursor += 8;
              this.bytesRead += 8;
              return result;*/
        return this.readHex(8);
    }
    public async readByte(): Promise<number> {
        const result = (await this.read(1)).readUInt8(0);
        this.cursor += 1;
        this.bytesRead += 1;
        return result;
    }
    public async readFloat(): Promise<number> {
        const result = (await this.read(4)).readFloatLE(0);
        this.cursor += 4;
        this.bytesRead += 4;
        return result;
    }
    public async readHex(count: number): Promise<string> {
        const result = (await this.read(count))
            .toString('hex');
        this.cursor += count;
        this.bytesRead += count;
        return result;
    }
    // https://stackoverflow.com/a/14601808
    public decodeUTF16LE(binaryStr: string): string {
        const cp = [];
        for (let i = 0; i < binaryStr.length; i += 2) {
            cp.push(binaryStr.charCodeAt(i) | (binaryStr.charCodeAt(i + 1) << 8));
        }
        return String.fromCharCode.apply(String, cp);
    }
    public async readLengthPrefixedString(): Promise<string> {
        let length = await this.readInt();
        if (length === 0) {
            return '';
        }
        console.log('strlen', length);
        let utf16 = false;
        if (length < 0) {
            // Thanks to @Goz3rr we know that this is now an utf16 based string
            // throw new Error('length of string < 0: ' + length);
            length = -2 * length;
            utf16 = true;
        }
        // TODO detect EOF
        /*if (this.cursor + length > this.stream.length) {
            console.log(this.readHex(32));
            // tslint:disable-next-line: no-console
            console.trace('buffer < ' + length);
            throw new Error('cannot read string of length: ' + length);
        }*/
        let resultStr;
        if (utf16) {
            const result = await this.read(length - 2);
            // .slice(this.cursor, this.cursor + length - 2);
            resultStr = this.decodeUTF16LE(result.toString('binary'));
            this.cursor += length - 2;
            this.bytesRead += length - 2;
        } else {
            const result = await this.read(length - 1);
            // .slice(this.cursor, this.cursor + length - 1);
            resultStr = result.toString('utf8');
            this.cursor += length - 1;
            this.bytesRead += length - 1;
        }
        if (this.cursor < 0) {
            throw new Error('Cursor overflowed to ' + this.cursor + ' by ' + length);
        }
        if (utf16) {
            await this.assertNullByteString(length, resultStr); // two null bytes for utf16
        }
        await this.assertNullByteString(length, resultStr);
        return resultStr;
    }
    public async assertNullByteString(length: number, result: string) {
        const zero = (await this.read(1)).readInt8(0);
        if (zero !== 0) {
            throw new Error('string (length: ' + length +
                ') does not end with zero, but with ' + zero + ': ' + result);
        }
        this.cursor += 1;
        this.bytesRead += 1;
    }
    public async assertNullByte() {
        const zero = (await this.read(1)).readInt8(0);
        if (zero !== 0) {
            throw new Error('expected 0 byte, but got ' + zero);
        }
        this.cursor += 1;
        this.bytesRead += 1;
    }
    public async assertNullInt() {
        const zero = await this.readInt();
        if (zero !== 0) {
            console.log(this.readHex(32));
            throw new Error('expected 0 int, but got ' + zero);
        }
    }
    public resetBytesRead() {
        this.bytesRead = 0;
    }
    //#endregion
}

/**
 * Archive that handles serializing the data when transforming json2sav.
 *
 * TODO: make more efficient by not using a bunch of string concatenations?
 * Maybe have a way to seek back to the position where the length of the next position is stored as
 * in the C++ code and then replace it there?
 */
export class SavingArchive extends BaseArchive {
    public buffer: Buffer; // TODO make private

    //#region write buffer
    public buffers: OutputBufferBuffer[] = []; // TODO make private
    private bytes: string = '';
    //#endregion

    constructor(buffer: Buffer) {
        super();
        this.buffer = buffer;
    }

    public isSaving(): boolean {
        return true;
    }

    public isLoading(): boolean {
        return false;
    }

    /**
     * Returns the final output after the transform is finished.
     */
    public getOutput(): string {
        return this.bytes;
    }

    public async _Int(obj: any, key: string | number, count: boolean = true): Promise<void> {
        this.writeInt(obj[key], count);
    }

    public async _String(obj: any, key: string | number, count: boolean = true): Promise<void> {
        this.writeLengthPrefixedString(obj[key], count);
    }

    public async _Float(obj: any, key: string | number): Promise<void> {
        this.writeFloat(obj[key]);
    }

    public async _Long(obj: any, key: string | number): Promise<void> {
        this.writeLong(obj[key]);
    }

    public async _Byte(obj: any, key: Key, count: boolean = true): Promise<void> {
        this.writeByte(obj[key], count);
    }

    public async transformBufferStart(resetBytesRead: boolean): Promise<number> {
        this.addBuffer();
        return 0;
    }

    public transformBufferEnd(): void {
        this.endBufferAndWriteSize();
    }

    public transformAssertNullByte(count: boolean = true): void {
        this.writeByte(0, count);
    }

    public transformAssertNullInt(count: boolean = true): void {
        this.writeInt(0, count);
    }

    public async _Hex(obj: any, key: Key, count: number, shouldCount: boolean = true):
        Promise<void> {
        this.writeHex(obj[key], shouldCount);
    }

    //#region should be private
    public write(bytes: string, count = true) {
        if (this.buffers.length === 0) {
            this.bytes += bytes;
        } else {
            this.buffers[this.buffers.length - 1].bytes += bytes;
            if (count) {
                this.buffers[this.buffers.length - 1].length += bytes.length;
            }
        }
    }
    public addBuffer() {
        this.buffers.push({ bytes: '', length: 0 });
    }
    public endBufferAndWriteSize() {
        const buffer = this.buffers[this.buffers.length - 1];
        this.buffers.pop(); // remove last element
        this.writeInt(buffer.length);
        this.write(buffer.bytes); // TODO check if correct
        return buffer.length;
    }
    public writeInt(value: number, count = true) {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32LE(value, 0);
        this.write(buffer.toString('binary'), count);
    }
    public writeLong(value: string) {
        this.writeHex(value);
    }
    public writeByte(value: number, count = true) {
        this.write(String.fromCharCode(value), count);
    }
    public writeFloat(value: number) {
        const buffer = Buffer.alloc(4);
        buffer.writeFloatLE(value, 0);
        this.write(buffer.toString('binary'));
    }
    public writeHex(value: string, count = true) {
        const buffer = Buffer.from(value, 'hex');
        this.write(buffer.toString('binary'), count);
    }
    // https://stackoverflow.com/a/14313213
    public isASCII(str: string): boolean {
        return /^[\x00-\x7F]*$/.test(str);
    }
    // https://stackoverflow.com/a/24391376
    public encodeUTF16LE(text: string) {
        const byteArray = new Uint8Array(text.length * 2);
        for (let i = 0; i < text.length; i++) {
            byteArray[i * 2] = text.charCodeAt(i) & 0xff;
            byteArray[i * 2 + 1] = (text.charCodeAt(i) >> 8) & 0xff;
        }
        return String.fromCharCode.apply(String, byteArray as any);
    }
    public writeLengthPrefixedString(value: string, count = true) {
        if (value.length === 0) {
            this.writeInt(0, count);
        } else {
            if (this.isASCII(value)) {
                this.writeInt(value.length + 1, count);
                this.write(value, count);
                this.writeByte(0, count);
            } else {
                this.writeInt(-value.length - 1, count);
                this.write(this.encodeUTF16LE(value));
                this.writeByte(0, count);
                this.writeByte(0, count);
            }
        }
    }
    //#endregion
}
