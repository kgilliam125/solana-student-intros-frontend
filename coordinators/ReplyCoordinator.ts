import bs58 from "bs58";
import * as web3 from "@solana/web3.js";
import { Reply } from "../models/Reply";
import * as borsh from "@project-serum/borsh";
import STUDENT_INTRO_PROGRAM_ID from "../utils/constants";
import BN from "bn.js";

export class ReplyCoordinator {
  static replyCount: number = 0;

  private static counterLayout = borsh.struct([
    borsh.str("discriminator"),
    borsh.u8("isInitialized"),
    borsh.u8("count"),
  ]);

  static async replyCounterPubkey(
    review: web3.PublicKey
  ): Promise<web3.PublicKey> {
    return (
      await web3.PublicKey.findProgramAddress(
        [review.toBuffer(), Buffer.from("reply")],
        new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID)
      )
    )[0];
  }

  static async syncreplyCount(
    connection: web3.Connection,
    review: web3.PublicKey
  ) {
    const counterPda = await this.replyCounterPubkey(review);

    try {
      const account = await connection.getAccountInfo(counterPda);
      this.replyCount = this.counterLayout.decode(account?.data).count;
    } catch (error) {
      console.log(error);
    }
  }

  static async fetchPage(
    connection: web3.Connection,
    review: web3.PublicKey,
    page: number,
    perPage: number
  ): Promise<Reply[]> {
    await this.syncreplyCount(connection, review);

    const start = this.replyCount - perPage * (page - 1);
    const end = Math.max(start - perPage, 0);

    let paginatedPublicKeys: web3.PublicKey[] = [];

    for (let i = start; i > end; i--) {
      const [pda] = await web3.PublicKey.findProgramAddress(
        [review.toBuffer(), new BN([i - 1]).toArrayLike(Buffer, "be", 8)],
        new web3.PublicKey(STUDENT_INTRO_PROGRAM_ID)
      );
      paginatedPublicKeys.push(pda);
    }

    const accounts = await connection.getMultipleAccountsInfo(
      paginatedPublicKeys
    );

    const replys = accounts.reduce((accum: Reply[], account) => {
      const reply = Reply.deserialize(account?.data);
      if (!reply) {
        return accum;
      }

      return [...accum, reply];
    }, []);

    return replys;
  }
}
