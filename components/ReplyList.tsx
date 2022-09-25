import {
  Button,
  Center,
  HStack,
  Spacer,
  Stack,
  Box,
  Heading,
} from "@chakra-ui/react";
import { FC, useState, useEffect } from "react";
import { ReplyCoordinator } from "../coordinators/ReplyCoordinator";
import { StudentIntro } from "../models/StudentIntro";
import { Reply } from "../models/Reply";
import { useConnection } from "@solana/wallet-adapter-react";

interface ReplyListProps {
  intro: StudentIntro;
}

export const ReplyList: FC<ReplyListProps> = ({ intro }: ReplyListProps) => {
  const { connection } = useConnection();
  const [page, setPage] = useState(1);
  const [replies, setReplies] = useState<Reply[]>([]);

  useEffect(() => {
    const fetch = async () => {
      intro.publicKey().then(async (reply) => {
        const replies = await ReplyCoordinator.fetchPage(
          connection,
          reply,
          page,
          3
        );
        setReplies(replies);
      });
    };
    fetch();
  }, [page, connection, intro]);

  return (
    <div>
      <Heading as="h1" size="l" ml={4} mt={2}>
        Existing Comments
      </Heading>
      {replies.map((reply, i) => (
        <Box
          key={i}
          p={4}
          textAlign={{ base: "left", md: "left" }}
          display={{ md: "flex" }}
          maxWidth="32rem"
          borderWidth={1}
          margin={2}
        >
          <div key={i}>{reply.reply}</div>
        </Box>
      ))}
      <Stack>
        <Center>
          <HStack w="full" mt={2} mb={8} ml={4} mr={4}>
            {page > 1 && (
              <Button onClick={() => setPage(page - 1)}>Previous</Button>
            )}
            <Spacer />
            {ReplyCoordinator.replyCount > page * 3 && (
              <Button onClick={() => setPage(page + 1)}>Next</Button>
            )}
          </HStack>
        </Center>
      </Stack>
    </div>
  );
};
