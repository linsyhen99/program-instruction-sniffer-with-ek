# Program-instruction-sniffer-with-ek

A sample project that showcases the usage of utilising EK-Parser that is able to decode the Solana On-Chain instruction data with an IDL file.

## About

- The list of program IDLs identified/indexed/curated by the SolanaFM's team is listed here in this library

  - https://www.npmjs.com/package/@solanafm/ek-idls-repo

- If your IDL is not part of the identified IDLs list, you can still use the Parser by manually injecting your IDL file into the Parser object
  - To manually initialise the Parser with your own IDL file please follow the guide below

## Populate the project with a .env file to get started

- Sample env configuration file

```
PROGRAM_HASH=
INSTRUCTIONS=
PARSER_TYPE=registry # "manual" | "registry"
STARTING_BLOCK=245000000
RPC_URL=

# Loading IDL from local file
IDL_TYPE=shank # "anchor" | "shank" | "kinobi"
```

---

# Initialising the Parser with a custom IDL file configuration

1. Ensure that your IDL file is either generated by anchor/shank
2. Create a `idl.json` file in the local directory and populate the json file with your generated IDL file
3. Indicate your `PROGRAM_HASH` in the `.env` file
4. Change your `PARSER_TYPE` to `manual`
5. Indicate your `IDL_TYPE` field in the `.env` file
