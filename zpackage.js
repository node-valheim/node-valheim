class ZPackage {
  buffer = null;
  index = 0;
  length = 0;

  constructor(buffer = null) {
    if (buffer === null) {
      this.buffer = Buffer.allocUnsafeSlow(128);
      this.index = 0;
      this.length = 0;
    }
    else {
      this.buffer = buffer;
      this.index = 0;
      this.length = buffer.length;
    }
  }

  writeByte(value) {
    this.write(value, 1, this.buffer.writeUInt8.bind(this.buffer));
  }

  writeBoolean(value) {
    this.writeByte(value ? 1 : 0);
  }

  writeInt16(value) {
    this.write(value, 2, this.buffer.writeInt16LE.bind(this.buffer));
  }

  writeInt32(value) {
    this.write(value, 4, this.buffer.writeInt32LE.bind(this.buffer));
  }

  writeInt64(value) {
    this.write(value, 8, this.buffer.writeBigInt64LE.bind(this.buffer));
  }

  writeUInt16(value) {
    this.write(value, 2, this.buffer.writeUInt16LE.bind(this.buffer));
  }

  writeUInt32(value) {
    this.write(value, 4, this.buffer.writeUInt32LE.bind(this.buffer));
  }

  writeUInt64(value) {
    this.write(value, 8, this.buffer.writeBigUInt64LE.bind(this.buffer));
  }

  writeFloat(value) {
    this.write(value, 4, this.buffer.writeFloatLE.bind(this.buffer));
  }

  writeDouble(value) {
    this.write(value, 8, this.buffer.writeDoubleLE.bind(this.buffer));
  }

  write7BitEncodedInt(value)
  {
    while (value >= 0x80)
    {
      this.writeByte(value | 0x80);
      value = value >> 7;
    }

    this.writeByte(value);
  }

  writeString(value) {
    // ok boys now it's time to get to work
    this.write7BitEncodedInt(value.length);
    this.write(value, value.length, this.buffer.write.bind(this.buffer));
  }

  writeZDOId(value) {
    this.writeInt64(value.userId);
    this.writeUInt32(value.id);
  }

  writeVector3(value) {
    this.writeFloat(value.x);
    this.writeFloat(value.y);
    this.writeFloat(value.z);
  }

  writeVector2i(value) {
    this.writeInt32(value.x);
    this.writeInt32(value.y);
  }

  writeQuaternion(value) {
    this.writeFloat(value.x);
    this.writeFloat(value.y);
    this.writeFloat(value.z);
    this.writeFloat(value.w);
  }

  writeBuffer(buffer) {
    this.writeUInt32(buffer.length);

    this.checkRealloc(buffer.length);

    buffer.copy(this.buffer, this.index);

    this.advance(buffer.length);
  }

  readByte() {
    return this.read(1, this.buffer.readUInt8.bind(this.buffer));
  }

  readBoolean() {
    return this.readByte() !== 0;
  }

  readInt16() {
    return this.read(2, this.buffer.readInt16LE.bind(this.buffer));
  }

  readInt32() {
    return this.read(4, this.buffer.readInt32LE.bind(this.buffer));
  }

  readInt64() {
    return this.read(8, this.buffer.readBigInt64LE.bind(this.buffer));
  }

  readUInt16() {
    return this.read(2, this.buffer.readUInt16LE.bind(this.buffer));
  }

  readUInt32() {
    return this.read(4, this.buffer.readUInt32LE.bind(this.buffer));
  }

  readUInt64() {
    return this.read(8, this.buffer.readBigUInt64LE.bind(this.buffer));
  }

  readFloat() {
    return this.read(4, this.buffer.readFloatLE.bind(this.buffer));
  }

  readDouble() {
    return this.read(8, this.buffer.readDoubleLE.bind(this.buffer));
  }

  read7BitEncodedInt()
  {
    let num = this.readByte();
    let length = num & 0x7F;

    while ((num & 0x80) > 0)
    {
      num = this.readByte();
      length = (length << 8) + (num & 0x7F);
    }

    return length;
  }

  readString() {
    let length = this.read7BitEncodedInt();

    if (!this.checkReadBounds(length))
      throw new RangeError('String with length ' + length + ' extends past buffer');

    let value = this.buffer.toString('utf8', this.index, this.index + length);

    this.index += length;

    return value;
  }

  readZDOId() {
    let userId = this.readInt64();
    let id = this.readUInt32();

    return {
      userId,
      id
    };
  }

  readVector3() {
    let x = this.readFloat();
    let y = this.readFloat();
    let z = this.readFloat();

    return { x, y, z };
  }

  readVector2i() {
    let x = this.readInt32();
    let y = this.readInt32();

    return { x, y };
  }

  readQuaternion() {
    let x = this.readFloat();
    let y = this.readFloat();
    let z = this.readFloat();
    let w = this.readFloat();

    return { x, y, z, w };
  }

  readBuffer() {
    let length = this.readUInt32();

    if (!this.checkReadBounds(length))
      throw new RangeError('Buffer with length ' + length + ' extends past buffer');

    let newBuffer = Buffer.allocUnsafe(length);
    this.buffer.copy(newBuffer, 0, this.index, this.index + length);

    this.index += length;

    return newBuffer;
  }

  write(value, size, performWrite) {
    this.checkRealloc(size);

    performWrite(value, this.index);

    this.advance(size);
  }

  read(size, performRead) {
    if (!this.checkReadBounds(size))
      throw new RangeError('Tried to read out of bounds of buffer');

    let value = performRead(this.index);
    this.index += size;

    return value;
  }

  checkRealloc(size) {
    if (this.length + size > this.buffer.length) {
      let newLength = this.buffer.length * 2

      while (this.length + size > newLength)
        newLength *= 2;

      let newBuffer = Buffer.allocUnsafe(newLength);

      this.buffer.copy(newBuffer);
      this.buffer = newBuffer;
    }
  }

  checkReadBounds(size) {
    if (this.index + size > this.length)
      return false;

    return true;
  }

  advance(size) {
    this.index += size;

    if (this.index > this.length)
      this.length = this.index;
  }

  getBuffer() {
    return this.buffer.slice(0, this.length);
  }
}

module.exports = ZPackage;