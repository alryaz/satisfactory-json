import { assert } from 'console';
import { Chunk } from './Chunk';
import { readdirSync } from 'fs';

/**
 * Name used to access a property or an array element
 */
export type Name = string | number;

export interface Context {
  obj: { [id: string]: any };
  vars: { [id: string]: any };
  parent?: Context;
}

export interface Command {
  /**
   * Executes this command
   * Returns the number of bytes this function needs to complete
   * or -1 to indicate that the command pointer should not advance (only useful if the newStackFrameCallback was called)
   * 
   * @param isLoading 
   * @param ctx 
   */
  exec(isLoading: boolean, ctx: Context, chunk: Chunk, newStackFrameCallback: (commands: Command[]) => void): number;
}

export class EnterObjectCommand implements Command {

  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  exec(isLoading: boolean, ctx: Context): number {
    if (isLoading) {
      // Make sure the object is created
      if (ctx.obj[this.name] === undefined) {
        ctx.obj[this.name] = {};
      }
    } else {
    }

    // Descend to the child object
    ctx.parent = {
      obj: ctx.obj,
      vars: ctx.vars,
      parent: ctx.parent
    };
    ctx.obj = ctx.obj[this.name];
    return 0;
  }
}

export class LeaveObjectCommand implements Command {
  exec(isLoading: boolean, ctx: Context): number {
    // Ascend to the parent context
    // TODO check that we actually ended an object?
    assert(ctx.parent !== undefined);
    ctx.obj = ctx.parent!.obj;
    ctx.vars = ctx.parent!.vars;
    ctx.parent = ctx.parent!.parent;
    return 0;
  }
}


export class EnterArrayCommand implements Command {

  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  exec(isLoading: boolean, ctx: Context): number {
    if (isLoading) {
      // Make sure the array is created
      if (ctx.obj[this.name] === undefined) {
        ctx.obj[this.name] = []
      }
    } else {
    }

    // Descend to the child array
    ctx.parent = {
      obj: ctx.obj,
      vars: ctx.vars,
      parent: ctx.parent
    };
    ctx.obj = ctx.obj[this.name];
    return 0;
  }
}

export class LeaveArrayCommand implements Command {
  exec(isLoading: boolean, ctx: Context): number {
    // Ascend to the parent context
    // TODO check that we actually ended an array?
    assert(ctx.parent !== undefined);
    ctx.obj = ctx.parent!.obj;
    ctx.vars = ctx.parent!.vars;
    ctx.parent = ctx.parent!.parent;
    return 0;
  }
}

export class EnterElemCommand implements Command {

  private index: Name;
  constructor(index: Name) {
    this.index = index;
  }

  exec(isLoading: boolean, ctx: Context): number {
    const index = getVar(ctx, this.index);

    if (isLoading) {
      // Make sure the array element is created
      if (ctx.obj[index] === undefined) {
        ctx.obj[index] = {}
      }
    } else {
    }

    // Descend to the child array
    ctx.parent = {
      obj: ctx.obj,
      vars: ctx.vars,
      parent: ctx.parent
    };
    ctx.obj = ctx.obj[index];
    return 0;
  }
}

export class LeaveElemCommand implements Command {
  exec(isLoading: boolean, ctx: Context): number {
    // Ascend to the parent context
    // TODO check that we actually ended an element?
    assert(ctx.parent !== undefined);
    ctx.obj = ctx.parent!.obj;
    ctx.vars = ctx.parent!.vars;
    ctx.parent = ctx.parent!.parent;
    return 0;
  }
}


function setVar(ctx: Context, name: Name, value: any): void {
  if (name.toString().charAt(0) === '_') {
    ctx.vars[name] = value;
  } else {
    ctx.obj[name] = value;
  }
}

function getVar(ctx: Context, name: Name): any {
  if (name.toString().charAt(0) === '_') {
    return ctx.vars[name];
  } else {
    return ctx.obj[name];
  }
}

export class IntCommand implements Command {
  private name: Name;
  private defaultValue?: (ctx: Context) => number;
  constructor(name: Name, defaultValue?: (ctx: Context) => number) {
    this.name = name;
    this.defaultValue = defaultValue;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk): number {
    if (isLoading) {
      const result = chunk.read(4);
      if (typeof result === 'number') {
        // return the amount of missing bytes
        return result;
      }
      setVar(ctx, this.name, result.readInt32LE(0));
      return 0;
    } else {
      // TODO writing
      return 0;
    }
  }
}


export class StrCommand implements Command {
  private name: Name;
  constructor(name: Name) {
    this.name = name;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk): number {
    if (isLoading) {
      chunk.setRollbackPoint();
      // TODO store rewind point in case something gets wrong in the middle of this

      const lengthBytes = chunk.read(4);
      if (typeof lengthBytes === 'number') {
        return lengthBytes;
      }
      let length = lengthBytes.readInt32LE(0);
      if (length === 0) {
        setVar(ctx, this.name, '');
        return 0;
      }

      //console.log('strlen', length);
      let utf16 = false;
      if (length < 0) {
        // Thanks to @Goz3rr we know that this is now an utf16 based string
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
        const result = chunk.read(length - 2);
        if (typeof result === 'number') {
          // rewind
          return chunk.rollback() + result;
        }
        // .slice(this.cursor, this.cursor + length - 2);
        resultStr = decodeUTF16LE(result.toString('binary'));
      } else {
        const result = chunk.read(length - 1);
        if (typeof result === 'number') {
          // rewind
          return chunk.rollback() + result;
        }
        // .slice(this.cursor, this.cursor + length - 1);
        resultStr = result.toString('utf8');
      }
      // TODO overflow
      /*      if (this.cursor < 0) {
              throw new Error('Cursor overflowed to ' + this.cursor + ' by ' + length);
            }*/
      if (utf16) {
        const result = chunk.read(1);
        if (typeof result === 'number') {
          // rewind
          return chunk.rollback() + result;
        }
        const zero = result.readInt8(0);
        if (zero !== 0) {
          throw new Error(`string(len: ${length}) does not end with zero, but with ${zero}`);
        }
      }

      const result = chunk.read(1);
      if (typeof result === 'number') {
        // rewind
        return chunk.rollback() + result;
      }
      const zero = result.readInt8(0);
      if (zero !== 0) {
        throw new Error(`string(len: ${length}) does not end with zero, but with ${zero}`);
      }

      setVar(ctx, this.name, resultStr);
      return 0;

    } else {
      // TODO writing
      return 0;
    }
  }
}

export class LongCommand implements Command {
  private name: Name;
  constructor(name: Name) {
    this.name = name;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk): number {
    if (isLoading) {
      const result = chunk.read(8);
      if (typeof result === 'number') {
        // return the amount of missing bytes
        return result;
      }
      setVar(ctx, this.name, result.toString('hex'));
      return 0;
    } else {
      // TODO writing
      return 0;
    }
  }
}

export class ByteCommand implements Command {
  private name: Name;
  constructor(name: Name) {
    this.name = name;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk): number {
    if (isLoading) {
      const result = chunk.read(1);
      if (typeof result === 'number') {
        // return the amount of missing bytes
        return result;
      }
      setVar(ctx, this.name, result.readInt8(0));
      return 0;
    } else {
      // TODO writing
      return 0;
    }
  }
}

export class FloatCommand implements Command {
  private name: Name;
  constructor(name: Name) {
    this.name = name;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk): number {
    if (isLoading) {
      const result = chunk.read(4);
      if (typeof result === 'number') {
        // return the amount of missing bytes
        return result;
      }
      setVar(ctx, this.name, result.readFloatLE(0));
      return 0;
    } else {
      // TODO writing
      return 0;
    }
  }
}


export class LoopCommand implements Command {
  private times: Name;
  private loopBodyCommands: Command[];
  constructor(times: Name, loopBodyCommands: Command[]) {
    this.times = times;
    this.loopBodyCommands = loopBodyCommands;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk, newStackFrameCallback: (commands: Command[]) => void): number {
    const iterations = getVar(ctx, this.times);

    if (ctx.vars._index === undefined) {
      ctx.vars._index = 0;
    } else {
      ctx.vars._index++;
    }

    if (ctx.vars._index < iterations) {
      newStackFrameCallback(this.loopBodyCommands);
      // pls keep the current command pointer the same, so that we can execute the next iteration
      return -1;
    } else {
      // continue after the loop
      return 0;
    }
  }
}

export class CondCommand implements Command {
  private cond: (ctx: Context) => boolean;
  private thenCommands: Command[];
  private elseCommands?: Command[];
  constructor(cond: (ctx: Context) => boolean, thenCommands: Command[], elseCommands?: Command[]) {
    this.cond = cond;
    this.thenCommands = thenCommands;
    this.elseCommands = elseCommands;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk, newStackFrameCallback: (commands: Command[]) => void): number {
    const result = this.cond(ctx);
    //console.log(`----------COND: ${result}`);
    if (result) {
      // execute then branch
      newStackFrameCallback(this.thenCommands);
    } else if (this.elseCommands !== undefined) {
      // execute else branch
      newStackFrameCallback(this.elseCommands);
    }
    return 0;
  }
}

export class ExecCommand implements Command {
  private code: (ctx: Context) => void;
  constructor(code: (ctx: Context) => void) {
    this.code = code;
  }
  exec(isLoading: boolean, ctx: Context, chunk: Chunk): number {
    this.code(ctx);
    return 0;
  }
}


// https://stackoverflow.com/a/14601808
function decodeUTF16LE(binaryStr: string): string {
  const cp = [];
  for (let i = 0; i < binaryStr.length; i += 2) {
    cp.push(binaryStr.charCodeAt(i) | (binaryStr.charCodeAt(i + 1) << 8));
  }
  return String.fromCharCode.apply(String, cp);
}