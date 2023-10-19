const { getProgramIdl } = require("@solanafm/ek-idls-repo");
const fs = require("fs");
const {
  SolanaFMParser,
  ParserType,
  checkIfInstructionParser,
} = require("@solanafm/ek-staging");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const app = async () => {
  const parserType = process.env.PARSER_TYPE;
  const instructions = process.env.INSTRUCTIONS.split(",");
  const startingBlock = Number.parseInt(process.env.STARTING_BLOCK);
  const programId = process.env.PROGRAM_HASH;
  const rpcUrl = process.env.RPC_URL;
  let parser = null;

  switch (parserType) {
    case "manual": {
      console.log("Loading Parser from manually provided IDL file");
      parser = loadCustomIdlAndInitialiseParser(programId);
      break;
    }
    case "registry": {
      console.log("Loading Parser from IDL registry");
      parser = await loadIdlFromRegistryAndInitialiseParser(programId);
      break;
    }
  }

  await sniffInstructions(
    startingBlock,
    parser,
    programId,
    instructions,
    rpcUrl
  );
};

const sniffInstructions = async (
  startingBlock,
  instructionParser,
  programId,
  whitelistedInstructions,
  rpcUrl
) => {
  const limit = Number.parseInt(process.env.BLOCK_LIMIT ?? "25");
  let blockNumberResponse = await axios.post(rpcUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "getBlocksWithLimit",
    params: [startingBlock, limit],
  });
  let blockNumbers = blockNumberResponse.data.result;

  blockNumbers.forEach(async (blockNumber) => {
    const blockResponse = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "getBlock",
      params: [
        blockNumber,
        {
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0,
          transactionDetails: "full",
          rewards: false,
        },
      ],
    });

    const transactions = blockResponse.data.result.transactions;
    transactions.forEach((transaction) => {
      if (transaction.meta.err === null) {
        const instructions = transaction.transaction.message.instructions;
        const transactionSignature = transaction.transaction.signatures[0];
        instructions.forEach((instruction) => {
          if (instruction.programId === programId) {
            const parsedInstruction = instructionParser.parseInstructions(
              instruction.data
            );

            if (whitelistedInstructions.includes(parsedInstruction.name)) {
              // write the signature to a local json file with append mode
              const data = JSON.stringify({
                instruction: parsedInstruction.name,
                signature: transactionSignature,
              });
              fs.writeFileSync(`./${programId}.json`, data, {
                flag: "a",
              });
            }
          }
        });

        const innerInstructions = transaction.meta.innerInstructions;
        innerInstructions.forEach((innerInstructions) => {
          if (innerInstructions.programId === programId) {
            const parsedInnerInstruction = instructionParser.parseInstructions(
              innerInstructions.data
            );
            if (whitelistedInstructions.includes(parsedInnerInstruction.name)) {
              // write the signature to a local json file with append mode
              const data = JSON.stringify({
                instruction: parsedInnerInstruction.name,
                signature: transactionSignature,
              });
              fs.writeFileSync(`./${programId}.json`, data, {
                flag: "a",
              });
            }
          }
        });
      }
    });
  });
};

// Creating a parser from the IDLs that are stored in the IDL registry
const loadIdlFromRegistryAndInitialiseParser = async (programId) => {
  const loadedIDL = await getProgramIdl(programId);
  if (loadedIDL) {
    const parser = new SolanaFMParser(loadedIDL, programId);
    const instructionParser = parser.createParser(ParserType.INSTRUCTION);

    if (instructionParser && checkIfInstructionParser(instructionParser)) {
      console.log("Successfully loaded parser for: ", programId);
      return instructionParser;
    }
  }

  console.error(
    `No IDL found for program: ${programId}, you can preload your IDL manually by providing the idl.json file in the root directory`
  );
};

// Creating a parser from a user loaded IDL JSON file
const loadCustomIdlAndInitialiseParser = (programId) => {
  const jsonString = fs.readFileSync("./idl.json", "utf8");
  const idlFile = JSON.parse(jsonString);
  const idlItem = {
    programId: programId,
    idl: idlFile,
    idlType: process.env.IDL_TYPE,
    idlSlotVersion: 210000000,
    chainId: undefined,
  };

  const parser = new SolanaFMParser(idlItem, idlItem.programId);
  const instructionParser = parser.createParser(ParserType.INSTRUCTION);
  if (instructionParser && checkIfInstructionParser(instructionParser)) {
    console.log("Successfully loaded parser for: ", programId);
    return instructionParser;
  }

  console.error(
    "Failed to create SolanaFM parser from manually provided IDL file"
  );
};

app();
