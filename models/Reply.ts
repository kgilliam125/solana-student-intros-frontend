import * as borsh from "@project-serum/borsh";
import { PublicKey } from "@solana/web3.js";
import STUDENT_INTRO_PROGRAM_ID from "../utils/constants";
import BN from "bn.js";

export class Reply {
  student: PublicKey;
  replier: PublicKey;
  reply: string;
  count: number;

  constructor(
    student: PublicKey,
    replier: PublicKey,
    reply: string,
    count: number
  ) {
    this.student = student;
    this.replier = replier;
    this.reply = reply;
    this.count = count;
  }

  async publicKey(): Promise<PublicKey> {
    return (
      await PublicKey.findProgramAddress(
        [
          this.student.toBuffer(),
          new BN(this.count).toArrayLike(Buffer, "be", 8),
        ],
        new PublicKey(STUDENT_INTRO_PROGRAM_ID)
      )
    )[0];
  }

  private static replyLayout = borsh.struct([
    borsh.str("discriminator"),
    borsh.u8("isInitialized"),
    borsh.publicKey("student"),
    borsh.publicKey("replier"),
    borsh.str("reply"),
    borsh.u64("count"),
  ]);

  private instructionLayout = borsh.struct([
    borsh.u8("variant"),
    borsh.str("reply"),
  ]);

  serialize(): Buffer {
    const buffer = Buffer.alloc(1000);
    this.instructionLayout.encode({ ...this, variant: 2 }, buffer);
    return buffer.slice(0, this.instructionLayout.getSpan(buffer));
  }

  static deserialize(buffer?: Buffer): Reply | null {
    if (!buffer) {
      return null;
    }

    try {
      const { student, replier, reply, count } =
        this.replyLayout.decode(buffer);
      return new Reply(student, replier, reply, count);
    } catch (e) {
      console.log("Deserialization error:", e);
      console.log(buffer);
      return null;
    }
  }
}
